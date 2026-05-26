# 🤝 Contributing & Local Development Guide

Thank you for your interest in contributing to this project! As a hobbyist project aimed at making our profiles and READMEs look sweeter and cleaner, contributions to expand the technology badge collection are highly welcome.

Here you will find all the technical details about how the project works under the hood, how to set up your local environment, and how to create new badges using Figma.

---

## ⚙️ The Automated Pipeline

To avoid uploading heavy or messy files, the project features an automated Node.js script (`scripts/update-readme.js`) that handles:

1. **Mass Optimization (SVGO):** Automatically cleans and compresses `.svg` files placed in the `/svg` folder, removing unnecessary Figma metadata and reducing sizes to `< 2KB` with zero quality loss.
2. **Catalog Auto-generation:** Scans and alphabetically sorts all badges to rebuild the interactive gallery table in the `README.md`.

### Local Development Setup

#### Prerequisites:

* [Node.js](https://nodejs.org/) (Version 16 or higher)
* NPM (Installed by default with Node.js)

#### Steps to Run Locally:

1. Fork this repository and clone it to your machine.
2. Install the required dependencies in the root directory:
   ```bash
   npm install
   ```
3. Place your new `.svg` files inside the `/svg/` folder.
4. Choose your build/commit workflow:
   * **Option A: Standard Build:**
     Run the build pipeline to optimize all SVGs and update the catalog in one go:
     ```bash
     npm run build
     ```
   * **Option B: Atomic Commits Pipeline (Highly Recommended for bulk additions):**
     Run the atomic commit tool to optimize each SVG, update the `README.md`, and make a clean, individual Git commit for each badge automatically:
     ```bash
     npm run commit
     ```
5. Submit a Pull Request (PR) with your changes for review.

---

## 🎨 Figma Template & Export Guidelines

To ensure all badges maintain a cohesive and beautiful style, we strongly recommend using our official Figma template instead of building them from scratch.

### 📐 1. Get the Official Template

Simply open our community file, duplicate it to your drafts, and start adding your badges:
👉 **[Figma Template Link]()**

### 📤 2. Critical Export Settings

When exporting your new badge from Figma as an SVG, please follow these crucial technical steps to ensure it works with our automated pipeline:

* **Outline Text (Mandatory):** Browsers render fonts differently. Before exporting, **you must convert all text layers to vector paths** by selecting the text and pressing:
  * **Windows:** `Ctrl + Shift + O`
  * **macOS:** `Cmd + Shift + O`
* **Clean SVG Export:** Select your badge frame, go to the Export panel, choose **SVG**, click on the export options dropdown (the three dots `...`), and **uncheck "Include id attribute"**. This keeps the generated SVG code clean and compatible with our pipeline.

### 🏷️ 3. Custom Capitalization Exceptions (Optional)
If your technology name requires a specific capitalization that doesn't follow standard casing rules (e.g., `HTML5` instead of `Html5`, `Node.js` instead of `Nodejs`, or `TailwindCSS` instead of `Tailwindcss`):
*   **Do not edit any JavaScript code.**
*   Simply open the **[`scripts/exceptions.json`](./scripts/exceptions.json)** file.
*   Add a new line at the end with the file's base name (in lowercase) and your custom formatted name:
    ```json
    "mytech": "MyTech"
    ```

---

That's it! If you have any questions or want to request a badge for a technology that is currently missing, feel free to open an Issue in the repository and the community will help you out.
