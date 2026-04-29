import { createContext, useContext, useState } from "react";

const MigrationContext = createContext(null);

const SHOPIFY_COLUMNS = [
  "Handle",
  "Title",
  "Body (HTML)",
  "Vendor",
  "Product Category",
  "Type",
  "Tags",
  "Published",
  "Option1 Name",
  "Option1 Value",
  "Option2 Name",
  "Option2 Value",
  "Option3 Name",
  "Option3 Value",
  "Variant SKU",
  "Variant Grams",
  "Variant Inventory Tracker",
  "Variant Inventory Qty",
  "Variant Inventory Policy",
  "Variant Fulfillment Service",
  "Variant Price",
  "Variant Compare At Price",
  "Variant Requires Shipping",
  "Variant Taxable",
  "Variant Barcode",
  "Image Src",
  "Image Position",
  "Image Alt Text",
  "Gift Card",
  "SEO Title",
  "SEO Description",
  "Variant Image",
  "Variant Weight Unit",
  "Variant Tax Code",
  "Cost per item",
  "Status",
];

function parseCSV(text) {
  const firstNewline = text.indexOf("\n");
  const firstLine = firstNewline > -1 ? text.slice(0, firstNewline) : text;
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const records = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  let i = 0;

  const pushRecord = () => {
    row.push(field);
    field = "";
    if (row.some((v) => v.trim() !== "")) records.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : null;

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i++;
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === delimiter) {
        row.push(field.trim());
        field = "";
        i++;
      } else if (ch === "\r" && next === "\n") {
        pushRecord();
        i += 2;
      } else if (ch === "\n" || ch === "\r") {
        pushRecord();
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
 
  row.push(field.trim());
  if (row.some((v) => v.trim() !== "")) records.push(row);

  if (records.length < 2) return { headers: [], rows: [] };

  const rawHeaders = records[0];
  rawHeaders[0] = rawHeaders[0].replace(/^\uFEFF/, "").trim();
  const headers = rawHeaders.map((h) => h.trim());

  const rows = records.slice(1).map((vals) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] !== undefined ? vals[idx].trim() : "";
    });
    return obj;
  });

  return { headers, rows };
}


function decodeHTML(str) {
  if (!str) return "";
  return (
    str
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/&#39;/gi, "\'")
      .replace(/&apos;/gi, "\'")
      .replace(/&quot;/gi, '"')
      .replace(/&nbsp;/gi, " ")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/&amp;/gi, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function cleanDescription(str) {
  if (!str) return "";
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/&#39;/gi, "\'")
    .replace(/&apos;/gi, "\'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&amp;/gi, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toHandle(title) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseImages(raw) {
  if (!raw) return [];
  let urls;
  if (raw.includes(", http")) {
    urls = raw.split(/,\s*(?=https?:\/\/)/).map((s) => s.trim());
  } else if (raw.includes("|")) {
    urls = raw.split("|").map((s) => s.trim());
  } else {
    urls = raw.split(",").map((s) => s.trim());
  }
  return urls.filter((u) => /^https?:\/\//i.test(u));
}

function emptyRow(handle) {
  const row = { Handle: handle };
  SHOPIFY_COLUMNS.forEach((col) => {
    if (!(col in row)) row[col] = "";
  });
  return row;
}

function mapToShopify(wooRow) {
  const title = decodeHTML(wooRow["Name"] || "").trim();
  const handle = toHandle(title);
  const description = cleanDescription(
    wooRow["Description"] || wooRow["Short description"] || "",
  );
  const sku = (wooRow["SKU"] || "").trim();
  const barcode = (wooRow["GTIN, UPC, EAN, or ISBN"] || "").trim();

  const regularPrice = (wooRow["Regular price"] || "").trim();
  const salePrice = (wooRow["Sale price"] || "").trim();
  const price = salePrice || regularPrice;
  const compareAt = salePrice && regularPrice ? regularPrice : "";

  const imageUrls = parseImages(wooRow["Images"] || "");
  const rawTags = decodeHTML(wooRow["Tags"] || "").trim();
  const categories = decodeHTML(wooRow["Categories"] || "").trim();

  const pubRaw = (wooRow["Published"] || "").trim();
  const published = pubRaw === "1" ? "true" : "false";
  const status = pubRaw === "1" ? "active" : "draft";

  const stockQty = (wooRow["Stock"] || "").trim();

  const weightKg = parseFloat(wooRow["Weight (kg)"] || "0") || 0;
  const weightGrams = weightKg > 0 ? Math.round(weightKg * 1000) : "";

  const taxable =
    (wooRow["Tax status"] || "").trim() === "taxable" ? "true" : "false";

  const opt1Name = decodeHTML(wooRow["Attribute 1 name"] || "").trim();
  const opt1Values = decodeHTML(wooRow["Attribute 1 value(s)"] || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const opt2Name = decodeHTML(wooRow["Attribute 2 name"] || "").trim();
  const opt2Values = decodeHTML(wooRow["Attribute 2 value(s)"] || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const baseRow = {
    Handle: handle,
    Title: title,
    "Body (HTML)": description,
    Vendor: "",
    "Product Category": categories,
    Type: categories.split(",")[0].trim(),
    Tags: rawTags,
    Published: published,
    "Option1 Name": opt1Name || "Title",
    "Option1 Value": opt1Values[0] || "Default Title",
    "Option2 Name": opt2Name || "",
    "Option2 Value": opt2Values[0] || "",
    "Option3 Name": "",
    "Option3 Value": "",
    "Variant SKU": sku,
    "Variant Grams": weightGrams,
    "Variant Inventory Tracker": "shopify",
    "Variant Inventory Qty": stockQty,
    "Variant Inventory Policy": "deny",
    "Variant Fulfillment Service": "manual",
    "Variant Price": price,
    "Variant Compare At Price": compareAt,
    "Variant Requires Shipping": "true",
    "Variant Taxable": taxable,
    "Variant Barcode": barcode,
    "Image Src": imageUrls[0] || "",
    "Image Position": imageUrls[0] ? "1" : "",
    "Image Alt Text": title,
    "Gift Card": "false",
    "SEO Title": title,
    "SEO Description": "",
    "Variant Image": "",
    "Variant Weight Unit": "kg",
    "Variant Tax Code": "",
    "Cost per item": "",
    Status: status,
  };

  const allRows = [baseRow];

  imageUrls.slice(1).forEach((imgUrl, idx) => {
    const r = emptyRow(handle);
    r["Image Src"] = imgUrl;
    r["Image Position"] = String(idx + 2);
    r["Image Alt Text"] = title;
    allRows.push(r);
  });

  if (opt1Values.length > 1) {
    opt1Values.slice(1).forEach((val) => {
      const r = emptyRow(handle);
      r["Option1 Name"] = opt1Name || "Title";
      r["Option1 Value"] = val;
      r["Option2 Name"] = opt2Name || "";
      r["Option2 Value"] = opt2Values[0] || "";
      r["Variant SKU"] = sku;
      r["Variant Grams"] = weightGrams;
      r["Variant Inventory Tracker"] = "shopify";
      r["Variant Inventory Qty"] = stockQty;
      r["Variant Inventory Policy"] = "deny";
      r["Variant Fulfillment Service"] = "manual";
      r["Variant Price"] = price;
      r["Variant Compare At Price"] = compareAt;
      r["Variant Requires Shipping"] = "true";
      r["Variant Taxable"] = taxable;
      r["Variant Barcode"] = barcode;
      r["Variant Weight Unit"] = "kg";
      allRows.push(r);
    });
  }

  return allRows;
}

function preprocessCSV(text) {
  const { headers, rows } = parseCSV(text);

  if (!headers.length) {
    throw new Error(
      "Could not parse CSV headers. Make sure the file is a valid WooCommerce CSV export.",
    );
  }

  const hasName = headers.some((h) => h.trim() === "Name");
  if (!hasName) {
    throw new Error(
      `This doesn't look like a WooCommerce export. Expected a "Name" column but found: ${headers.slice(0, 6).join(", ")}…`,
    );
  }

  const stats = {
    totalRows: rows.length,
    removedZeroStock: 0,
    removedVariations: 0,
    finalRows: 0,
  };

  const withoutVariations = rows.filter((row) => {
    const type = (row["Type"] || "").toLowerCase().trim();
    if (type === "variation" || type === "variable variation") {
      stats.removedVariations++;
      return false;
    }
    return true;
  });

  const withStock = withoutVariations.filter((row) => {
    const stockRaw = (row["Stock"] ?? "").trim();
    if (stockRaw === "") {
      stats.removedZeroStock++;
      return false;
    } 
    const stockNum = Number(stockRaw);
    if (!isNaN(stockNum) && stockNum <= 0) {
      stats.removedZeroStock++;
      return false;
    }
    return true;
  });

  const shopifyRows = withStock.flatMap((row) => mapToShopify(row));
  stats.finalRows = shopifyRows.length;

  return { columns: SHOPIFY_COLUMNS, rows: shopifyRows, stats };
}

export function MigrationProvider({ children }) {
  const [fileName, setFileName] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const processFile = (file) => {
    setIsProcessing(true);
    setError(null);
    setFileName(file.name);
    setProcessedData(null);

    const runParse = (text) => {
      try {
        const result = preprocessCSV(text);
        setProcessedData(result);
      } catch (err) {
        setError(err.message || "Failed to parse CSV.");
      } finally {
        setIsProcessing(false);
      }
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const hasMojibake = /Ã[\u0080-\u00FF]/.test(text);
      if (hasMojibake) {
        const reader2 = new FileReader();
        reader2.onload = (e2) => runParse(e2.target.result);
        reader2.onerror = () => {
          setError("Failed to read file.");
          setIsProcessing(false);
        };
        reader2.readAsText(file, "ISO-8859-1");
      } else {
        runParse(text);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsProcessing(false);
    };
    reader.readAsText(file, "UTF-8");
  };

  const reset = () => {
    setFileName(null);
    setProcessedData(null);
    setError(null);
  };

  return (
    <MigrationContext.Provider
      value={{
        fileName,
        processedData,
        isProcessing,
        error,
        processFile,
        reset,
      }}
    >
      {children}
    </MigrationContext.Provider>
  );
}

export function useMigration() {
  const ctx = useContext(MigrationContext);
  if (!ctx)
    throw new Error("useMigration must be used inside MigrationProvider");
  return ctx;
}
