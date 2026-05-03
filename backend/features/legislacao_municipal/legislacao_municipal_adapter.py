"""
Adapter para download de matérias legislativas individuais via Playwright.

Gerencia a automação de navegador para contornar reCAPTCHA v3
e baixar PDFs do diariooficialms.com.br.
"""

from __future__ import annotations

import asyncio
import base64
import logging

from backend.scripts.scrape_diario_oficial_models import (
    PAGE_URL,
    RECAPTCHA_SITE_KEY,
)

logger = logging.getLogger(__name__)

ALLOWED_DOWNLOAD_PREFIX = "https://www.diariooficialms.com.br/baixar-materia/"


def validate_download_url(url: str) -> None:
    """Valida se a URL de download é permitida."""
    if not url.startswith(ALLOWED_DOWNLOAD_PREFIX):
        raise ValueError(f"URL de download inválida: {url}")


def validate_pdf_content(content: bytes) -> None:
    """Valida se o conteúdo é um PDF válido (magic bytes)."""
    if not content.startswith(b"%PDF"):
        raise ValueError("Conteúdo retornado não é um PDF válido")


async def download_legislacao_pdf(link_legislacao: str) -> tuple[bytes, str]:
    """
    Baixa uma matéria legislativa individual via Playwright.

    Args:
        link_legislacao: URL /baixar-materia/{id}/{hash}

    Returns:
        Tupla (pdf_bytes, filename)

    Raises:
        ValueError: URL inválida ou conteúdo não-PDF
        Exception: Falha no Playwright/download
    """
    from playwright.async_api import async_playwright  # noqa: PLC0415

    validate_download_url(link_legislacao)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
            ],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 720},
        )
        page = await context.new_page()

        try:
            await page.goto(PAGE_URL, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(2)  # Aguarda reCAPTCHA carregar

            result = await page.evaluate(
                """async ({ url, siteKey }) => {
                    const maxWait = 15000;
                    const start = Date.now();
                    while (typeof grecaptcha === 'undefined' ||
                           typeof grecaptcha.execute === 'undefined') {
                        if (Date.now() - start > maxWait)
                            throw new Error('grecaptcha timeout');
                        await new Promise(r => setTimeout(r, 200));
                    }
                    const token = await grecaptcha.execute(siteKey, {action: 'baixar_materia'});
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: 'g-recaptcha-response=' + encodeURIComponent(token),
                    });
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    const buf = await resp.arrayBuffer();
                    const bytes = new Uint8Array(buf);
                    let bin = '';
                    for (let i = 0; i < bytes.length; i++)
                        bin += String.fromCharCode(bytes[i]);
                    return btoa(bin);
                }""",
                {
                    "url": link_legislacao,
                    "siteKey": RECAPTCHA_SITE_KEY,
                },
            )

            pdf_bytes = base64.b64decode(result)
            validate_pdf_content(pdf_bytes)

            # Extrai ID do path para nome do arquivo
            id_part = link_legislacao.rsplit("/", 2)[1]
            filename = f"legislacao_{id_part}.pdf"

            return pdf_bytes, filename

        finally:
            await browser.close()
