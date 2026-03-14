from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch

# -----------------------
# Register Custom Font
# -----------------------
pdfmetrics.registerFont(
    TTFont("MyFont", "./Fonts/GoogleSans.ttf")
)

# -----------------------
# Header, Footer & Watermark
# -----------------------
def add_header_footer(canvas, doc):
    canvas.saveState()

    # Header logo
    canvas.drawImage(
        "assets/studzee.png",
        x=40,
        y=A4[1] - 80,
        width=60,
        height=60,
        preserveAspectRatio=True,
        mask='auto'
    )

    canvas.setFont("MyFont", 14)
    canvas.drawString(120, A4[1] - 50, "Studzee")

    # Footer text
    canvas.setFont("MyFont", 9)
    canvas.drawString(40, 40, "© 2026 Studzee. All rights reserved.")

    # Page number
    page_number_text = f"Page {doc.page}"
    canvas.drawRightString(A4[0] - 40, 40, page_number_text)

    # Watermark
    canvas.setFillAlpha(0.1)
    canvas.drawImage(
        "assets/studzee.png",
        x=100,
        y=250,
        width=300,
        height=300,
        preserveAspectRatio=True,
        mask='auto'
    )
    canvas.setFillAlpha(1)

    canvas.restoreState()

# -----------------------
# Create PDF
# -----------------------
doc = SimpleDocTemplate(
    "invoice.pdf",
    pagesize=A4,
    rightMargin=40,
    leftMargin=40,
    topMargin=100,
    bottomMargin=60
)

# -----------------------
# Styles
# -----------------------
title_style = ParagraphStyle(
    name="Title",
    fontName="MyFont",
    fontSize=20,
    spaceAfter=20
)

body_style = ParagraphStyle(
    name="Body",
    fontName="MyFont",
    fontSize=11,
    leading=15
)

# -----------------------
# Content
# -----------------------
content = []

# Invoice Title
content.append(Paragraph("INVOICE", title_style))
content.append(Spacer(1, 12))

# Invoice info
content.append(Paragraph("Invoice No: INV-001", body_style))
content.append(Paragraph("Date: 23 Feb 2026", body_style))
content.append(Spacer(1, 20))

# -----------------------
# Invoice Table
# -----------------------
table_data = [
    ["Item", "Description", "Qty", "Unit Price", "Total"],
    ["Website Development", "Frontend + Backend", "1", "₹50,000", "₹50,000"],
    ["Cloud Setup", "AWS Infrastructure", "1", "₹15,000", "₹15,000"],
    ["Maintenance", "3 Months Support", "1", "₹10,000", "₹10,000"],
    ["", "", "", "Grand Total", "₹75,000"],
]

table = Table(table_data, colWidths=[2*inch, 2.5*inch, 1*inch, 1.2*inch, 1.2*inch])

table.setStyle(TableStyle([
    ("FONT", (0, 0), (-1, 0), "MyFont"),
    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
    ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ("ALIGN", (2, 1), (-1, -1), "CENTER"),
    ("FONT", (0, 1), (-1, -1), "MyFont"),
    ("BACKGROUND", (0, -1), (-1, -1), colors.whitesmoke),
    ("SPAN", (0, -1), (3, -1)),
    ("ALIGN", (3, -1), (-1, -1), "RIGHT"),
]))

content.append(table)
content.append(Spacer(1, 30))

# Notes
content.append(Paragraph(
    "Thank you for your business buddy. Please make the payment within 15 days.",
    body_style
))

# -----------------------
# Build PDF
# -----------------------
doc.build(
    content,
    onFirstPage=add_header_footer,
    onLaterPages=add_header_footer
)

print("Invoice PDF created successfully!")