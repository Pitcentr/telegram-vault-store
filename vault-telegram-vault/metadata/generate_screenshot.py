#!/usr/bin/env python3
"""
Generate screenshot from HTML template using Playwright or Selenium.
Install: pip install playwright && playwright install chromium
"""

import sys
import os

try:
    from playwright.sync_api import sync_playwright
    
    def generate_screenshot():
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={'width': 1920, 'height': 1080})
            
            # Load HTML file
            html_path = os.path.join(os.path.dirname(__file__), 'screenshot-template.html')
            page.goto(f'file://{os.path.abspath(html_path)}')
            
            # Wait for content to load
            page.wait_for_timeout(1000)
            
            # Find the phone frame element
            phone_frame = page.locator('.phone-frame')
            
            # Take screenshot
            output_path = os.path.join(os.path.dirname(__file__), 'screenshot1.png')
            phone_frame.screenshot(path=output_path)
            
            browser.close()
            
            print(f"✅ Screenshot saved to: {output_path}")
            return True
            
except ImportError:
    print("❌ Playwright not installed.")
    print("\nInstall with:")
    print("  pip install playwright")
    print("  playwright install chromium")
    print("\nOr use manual method:")
    print("  1. Open screenshot-template.html in browser")
    print("  2. Press F12 -> Ctrl+Shift+P")
    print("  3. Type 'Capture node screenshot'")
    print("  4. Click on .phone-frame element")
    print("  5. Save as screenshot1.png")
    sys.exit(1)

if __name__ == '__main__':
    try:
        generate_screenshot()
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTry manual method instead:")
        print("  1. Open screenshot-template.html in Chrome/Edge")
        print("  2. Press F12 to open DevTools")
        print("  3. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)")
        print("  4. Type 'Capture node screenshot'")
        print("  5. Click on the phone frame")
        print("  6. Save as screenshot1.png")
        sys.exit(1)
