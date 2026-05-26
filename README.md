# Study Site Locator
Study Site Locator (SSL) is a simple Google Chrome extension tool to assist researchers in identifying the location a particular research paper was conducted in. It functions similarly to the "CTRL-F" or "CMD F" search function, allowing users to cycle through results. Results are presented by feeding the paper into a named entity recognition (NER) model, Bert.

> [!IMPORTANT] This is a Google Chrome extension only. Support for other browsers depends on demand.

# Installation

### Option 1: Google Chrome extension store

*Pending publication.*
* Automatic updates and support.
* Get the most recent version.

### Option 2: Download from source code
1. Download the `/dist/` folder.
2. Go to `chrome://extensions/` via the address bar.
   * Or, alternatively ...
     1. Press the button with 3 vertical dots (top right).
     2. Navigate to `Extensions > Manage Extensions`
3. `Load unpacked`
4. Load the `/dist/` folder.
   * You should see the extension, alongside your other extensions, as "Study Site Locator".

## Use-Case
> [!NOTE] The best use-case is a full-text systematic review from a well-known publisher database such as Pubmed, ScienceDirect, Taylor & Francis, SpringerLink, etc.


* Press `Find Locations` to use the tool on the webpage you are on.
* Cycle through the results with the arrows <u>after</u> it has loaded. While the NER runs, you will not get consistent cycles.

>[!CAUTION] There is no support for PDFs yet, only full text links.

![Local Animation](./use_case/use_case_1.gif)

## MIT License

Copyright (c) 2026 Shauna Vanderhorst

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
