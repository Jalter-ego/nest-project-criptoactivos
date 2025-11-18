import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateDynamicReport(userId: string, userPrompt: string) {
    const criteria = await this.parsePromptWithGemini(userPrompt);

    if (!criteria) {
      throw new BadRequestException('No se pudo interpretar la solicitud.');
    }

    if (
      !criteria.filters.userId &&
      criteria.entity !== 'USER' &&
      criteria.entity !== 'ACTIVE'
    ) {
      criteria.filters.userId = userId;
    }

    let data: any[] = [];
    const title = criteria.title || this.getDefaultTitle(criteria.entity);

    // 2. OBTENER DATOS SEGÚN LA ENTIDAD
    data = await this.fetchEntityData(criteria.entity, criteria.filters);

    // 3. GENERAR EL ARCHIVO
    if (criteria.format === 'EXCEL') {
      const buffer = await this.generateExcel(data, title, criteria.entity);
      return {
        buffer,
        filename: `reporte-${criteria.entity.toLowerCase()}.xlsx`,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } else {
      const buffer = await this.generatePDF(data, title, criteria.entity);
      return {
        buffer,
        filename: `reporte-${criteria.entity.toLowerCase()}.pdf`,
        mimeType: 'application/pdf',
      };
    }
  }

  private getDefaultTitle(entity: string): string {
    const titles = {
      TRANSACTION: 'Reporte de Transacciones',
      PORTAFOLIO: 'Reporte de Portafolios',
      HOLDING: 'Reporte de Tenencias',
      ACTIVE: 'Reporte de Activos',
      USER: 'Reporte de Usuarios',
      FEEDBACK: 'Reporte de Retroalimentación',
    };
    return titles[entity] || 'Reporte';
  }

  private async fetchEntityData(entity: string, filters: any) {
    const whereClause: any = {};

    // Construir filtros dinámicos según la entidad
    switch (entity) {
      case 'TRANSACTION':
        if (filters.userId) whereClause.portafolio = { userId: filters.userId };
        if (filters.activeSymbol)
          whereClause.activeSymbol = filters.activeSymbol;
        if (filters.type) whereClause.type = filters.type;
        if (filters.portafolioId)
          whereClause.portafolioId = filters.portafolioId;
        if (filters.startDate || filters.endDate) {
          whereClause.createdAt = {};
          if (filters.startDate)
            whereClause.createdAt.gte = new Date(filters.startDate);
          if (filters.endDate)
            whereClause.createdAt.lte = new Date(filters.endDate);
        }
        return await this.prisma.transaction.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
        });

      case 'PORTAFOLIO':
        if (filters.userId) whereClause.userId = filters.userId;
        return await this.prisma.portafolio.findMany({
          where: whereClause,
          include: {
            user: true,
            _count: {
              select: { transactions: true, holdings: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      case 'HOLDING':
        if (filters.portafolioId)
          whereClause.portafolioId = filters.portafolioId;
        if (filters.activeSymbol)
          whereClause.activeSymbol = filters.activeSymbol;
        if (filters.userId) whereClause.portafolio = { userId: filters.userId };
        return await this.prisma.holding.findMany({
          where: whereClause,
          include: {
            active: true,
            portafolio: {
              include: { user: true },
            },
          },
          orderBy: { quantity: 'desc' },
        });

      case 'ACTIVE':
        return await this.prisma.active.findMany({
          include: {
            _count: {
              select: { transactions: true, holdings: true },
            },
          },
          orderBy: { symbol: 'asc' },
        });

      case 'USER':
        return await this.prisma.user.findMany({
          include: {
            _count: {
              select: { portafolio: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      case 'FEEDBACK':
        if (filters.portafolioId)
          whereClause.portafolioId = filters.portafolioId;
        if (filters.userId) whereClause.portafolio = { userId: filters.userId };
        return await this.prisma.feedback.findMany({
          where: whereClause,
          include: {
            portafolio: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      default:
        throw new BadRequestException(`Entidad no soportada: ${entity}`);
    }
  }

  // --- MÉTODO PRIVADO: HABLAR CON GEMINI ---
  private async parsePromptWithGemini(prompt: string) {
    console.log(prompt);

    const currentDate = new Date().toISOString().split('T')[0];

    const systemPrompt = `
      Eres un asistente de base de datos avanzado. Hoy es ${currentDate}.
      Analiza la solicitud del usuario y devuélveme UNICAMENTE un objeto JSON válido.
      
      ENTIDADES DISPONIBLES:
      - TRANSACTION: Transacciones de compra/venta
      - PORTAFOLIO: Portafolios de inversión  
      - HOLDING: Tenencias actuales de activos
      - ACTIVE: Activos disponibles
      - USER: Usuarios del sistema
      - FEEDBACK: Retroalimentación del sistema
      
      Estructura JSON requerida:
      {
        "entity": "TRANSACTION" | "PORTAFOLIO" | "HOLDING" | "ACTIVE" | "USER" | "FEEDBACK",
        "filters": {
          // Filtros específicos según la entidad
          "userId": string o null,
          "activeSymbol": string o null,
          "type": "BUY" | "SELL" o null,
          "startDate": "YYYY-MM-DD" o null,
          "endDate": "YYYY-MM-DD" o null,
          "portafolioId": string o null
        },
        "format": "PDF" | "EXCEL",
        "title": "Título personalizado del reporte" (opcional)
      }
      
      EJEMPLOS:
      - "Reporte de transacciones de Bitcoin" -> {"entity": "TRANSACTION", "filters": {"activeSymbol": "BTC-USD"}}
      - "Mi portafolio actual" -> {"entity": "PORTAFOLIO", "filters": {"userId": "user123"}}
      - "Tenencias del portafolio X" -> {"entity": "HOLDING", "filters": {"portafolioId": "port123"}}
      
      Solicitud: "${prompt}"
    `;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      let text = response.text();

      text = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(text);
    } catch (error) {
      console.error('Error parseando con Gemini:', error);
      return null;
    }
  }

  // --- MÉTODO PRIVADO: GENERAR EXCEL ---
  private async generateExcel(
    data: any[],
    title: string,
    entity: string,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Datos');

    const template = this.getEntityTemplate(entity);
    sheet.columns = template.columns;

    sheet.addRows(data);

    template.columns.forEach((col, index) => {
      if (col.format) {
        const column = sheet.getColumn(index + 1);
        column.eachCell((cell, rowNumber) => {
          if (rowNumber > 1) {
            this.applyCellFormat(cell, col.format);
          }
        });
      }
    });

    // Estilos del header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' },
    };

    // Convertir a Buffer
    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  private getEntityTemplate(entity: string): any {
    const templates = {
      TRANSACTION: {
        columns: [
          { header: 'Tipo', key: 'type', width: 10 },
          { header: 'Activo', key: 'activeSymbol', width: 15 },
          { header: 'Cantidad', key: 'amount', width: 15, format: 'number' },
          { header: 'Precio', key: 'price', width: 15, format: 'currency' },
          { header: 'Fecha', key: 'createdAt', width: 20, format: 'date' },
        ],
      },
      PORTAFOLIO: {
        columns: [
          { header: 'Nombre', key: 'name', width: 20 },
          { header: 'Usuario', key: 'user.name', width: 20 },
          { header: 'Efectivo', key: 'cash', width: 15, format: 'currency' },
          {
            header: 'Invertido',
            key: 'invested',
            width: 15,
            format: 'currency',
          },
          {
            header: 'Transacciones',
            key: '_count.transactions',
            width: 12,
            format: 'number',
          },
          {
            header: 'Tenencias',
            key: '_count.holdings',
            width: 10,
            format: 'number',
          },
        ],
      },
      HOLDING: {
        columns: [
          { header: 'Portafolio', key: 'portafolio.name', width: 20 },
          { header: 'Usuario', key: 'portafolio.user.name', width: 20 },
          { header: 'Activo', key: 'active.name', width: 15 },
          { header: 'Símbolo', key: 'activeSymbol', width: 12 },
          { header: 'Cantidad', key: 'quantity', width: 15, format: 'number' },
        ],
      },
      ACTIVE: {
        columns: [
          { header: 'Símbolo', key: 'symbol', width: 12 },
          { header: 'Nombre', key: 'name', width: 20 },
          {
            header: 'Transacciones',
            key: '_count.transactions',
            width: 12,
            format: 'number',
          },
          {
            header: 'Tenencias',
            key: '_count.holdings',
            width: 10,
            format: 'number',
          },
        ],
      },
      USER: {
        columns: [
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Nombre', key: 'name', width: 20 },
          {
            header: 'Portafolios',
            key: '_count.portafolio',
            width: 12,
            format: 'number',
          },
          {
            header: 'Fecha Creación',
            key: 'createdAt',
            width: 20,
            format: 'date',
          },
        ],
      },
      FEEDBACK: {
        columns: [
          { header: 'Tipo', key: 'type', width: 15 },
          { header: 'Mensaje', key: 'message', width: 40 },
          { header: 'Portafolio', key: 'portafolio.name', width: 20 },
          { header: 'Usuario', key: 'portafolio.user.name', width: 20 },
          { header: 'Fecha', key: 'createdAt', width: 20, format: 'date' },
        ],
      },
    };
    return templates[entity] || templates['TRANSACTION'];
  }

  private applyCellFormat(cell: any, format: string) {
    switch (format) {
      case 'currency':
        cell.numFmt = '"$"#,##0.00';
        break;
      case 'date':
        cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
        break;
      case 'number':
        cell.numFmt = '#,##0.00';
        break;
    }
  }

  // --- MÉTODO PRIVADO: GENERAR PDF ---
  private async generatePDF(
    data: any[],
    title: string,
    entity: string,
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Header con mejor diseño
      this.addPDFHeader(doc, title, data.length);

      // Tabla de datos
      this.addPDFTable(doc, data, entity);

      // Footer
      this.addPDFFooter(doc);

      doc.end();
    });
  }

  private addPDFHeader(doc: any, title: string, recordCount: number) {
    // Logo o título principal
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Sistema de Criptoactivos', { align: 'center' });
    doc.moveDown(0.5);

    // Título del reporte
    doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Fecha de generación: ${new Date().toLocaleDateString()}`, {
        align: 'right',
      });
    doc.text(`Registros encontrados: ${recordCount}`, { align: 'right' });
    doc.moveDown();
  }
  private addPDFTable(doc: any, data: any[], entity: string) {
    const template = this.getEntityTemplate(entity);

    const columnPositions = [50, 120, 200, 280, 360, 440, 520];

    // Headers de la tabla
    doc.fontSize(9).font('Helvetica-Bold');

    const headerY = doc.y;

    template.columns.forEach((col, index) => {
      const xPos =
        columnPositions[index] ||
        columnPositions[columnPositions.length - 1] +
          (index - columnPositions.length + 1) * 80;

      doc.text(col.header, xPos, headerY, { align: 'left' });
    });

    doc.y = headerY + 15;

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown(0.5);

    // Datos
    doc.font('Helvetica').fontSize(8);

    data.forEach((row, index) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(10).font('Helvetica-Bold').text('Continuación...', 50, 50);
        doc.moveDown();
        doc.fontSize(8).font('Helvetica');
      }

      const rowY = doc.y;

      template.columns.forEach((col, colIndex) => {
        const xPos =
          columnPositions[colIndex] ||
          columnPositions[columnPositions.length - 1] +
            (colIndex - columnPositions.length + 1) * 80;

        let value = this.getNestedValue(row, col.key);
        value = this.formatValue(value, col.format);

        if (value && value.length > 15) {
          value = value.substring(0, 12) + '...';
        }

        doc.text(value || '-', xPos, rowY, { align: 'left', width: 60 });
      });

      doc.y = rowY + 12;
    });
  }

  private addPDFFooter(doc: any) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Página ${i + 1} de ${pageCount}`, 50, doc.page.height - 50, {
          align: 'center',
        });
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return `$${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
      case 'date':
        return new Date(value).toLocaleDateString('es-ES');
      case 'number':
        return Number(value).toLocaleString('es-ES');
      default:
        return String(value);
    }
  }
}
