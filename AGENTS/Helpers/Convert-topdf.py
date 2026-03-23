import matplotlib.pyplot as plt
from io import BytesIO

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------------- REGISTER FONT ----------------
pdfmetrics.registerFont(
    TTFont("MyFont", "./Fonts/GoogleSans.ttf")
)

# ---------------- CONTENT ----------------
content = [
    "Gradient descent is an optimization algorithm used to minimize a differentiable function.",

    "The gradient vector ∇wE is composed of the partial derivatives of the error function E with respect to the parameters w.",

    "Gradient descent starts from a random initial set of parameters and updates them as follows:",

    "$$\\Delta w_i = -\\eta \\frac{\\partial E}{\\partial w_i}$$",

    "$$w_i = w_i + \\Delta w_i$$",

    "where η is the learning rate."
]

img_width = 250
img_height = 250

page_width, page_height = A4

x = (page_width - img_width) / 2
y = (page_height - img_height) / 2


# ---------------- HEADER / FOOTER ----------------
def add_header_footer(canvas, doc):
    canvas.saveState()

    # Logo
    canvas.drawImage(
        "assets/studzee.png",
        x=40,
        y=A4[1] - 80,
        width=50,
        height=50,
        preserveAspectRatio=True,
        mask='auto'
    )

    # Title
    canvas.setFont("MyFont", 14)
    canvas.drawString(100, A4[1] - 50, "Studzee")

    # Footer text
    canvas.setFont("MyFont", 9)
    canvas.drawString(40, 40, "© 2026 Studzee. All rights reserved.")

    # Page number
    canvas.drawRightString(A4[0] - 40, 40, f"Page {doc.page}")

    # Watermark
    canvas.setFillAlpha(0.08)
    canvas.drawImage(
        "assets/studzee.png",
        x=x,
        y=y,
        width=img_width,
        height=img_height,
        preserveAspectRatio=True,
        mask='auto'
    )
    canvas.setFillAlpha(1)

    canvas.restoreState()

# ---------------- STYLES ----------------
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

# ---------------- LATEX TO IMAGE ----------------
def latex_to_image(latex_str):
    fig = plt.figure(figsize=(4, 0.7))  # compact height
    fig.patch.set_alpha(0)

    plt.text(0.5, 0.5, f"${latex_str}$", ha='center', va='center')
    plt.axis('off')

    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight', dpi=120)
    plt.close(fig)

    buffer.seek(0)

    img = Image(buffer)
    img._restrictSize(400, 120)  # prevent overflow
    img.hAlign = 'CENTER'

    return img

# ---------------- PDF SETUP ----------------
doc = SimpleDocTemplate(
    "output.pdf",
    pagesize=A4,
    rightMargin=40,
    leftMargin=40,
    topMargin=100,
    bottomMargin=60
)

elements = []

# ---------------- BUILD CONTENT ----------------
for item in content:
    if isinstance(item, str) and item.startswith("$$") and item.endswith("$$"):
        latex_str = item[2:-2]

        elements.append(latex_to_image(latex_str))
        elements.append(Spacer(1, 6))  # tighter spacing

    else:
        elements.append(Paragraph(item, body_style))
        elements.append(Spacer(1, 10))

# ---------------- BUILD PDF ----------------
doc.build(
    elements,
    onFirstPage=add_header_footer,
    onLaterPages=add_header_footer
)

print("✅ PDF generated successfully: output.pdf")