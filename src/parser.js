const TTEParser = (function() {
  let methods = {};

  /**
   * Parse HTML table to excel worksheet
   * @param {object} ws The worksheet object
   * @param {HTML entity} table The table to be converted to excel sheet
   */
  methods.parseDomToTable = function(ws, table, opts) {
    let _r, _c, cs, rs;
    let rows = table.getElementsByTagName("tr");
    let merges = [];
    for (_r = 0; _r < rows.length; ++_r) {
      let row = rows[_r];
      let tds = row.children;
      for (_c = 0; _c < tds.length; ++_c) {
        let td = tds[_c];
        if (td.getAttribute("data-f-outline") === "true") continue;
        // calculate merges
        cs = parseInt(td.getAttribute("colspan")) || 1;
        rs = parseInt(td.getAttribute("rowspan")) || 1;
        if (cs > 1 || rs > 1) {
          merges.push([
            getExcelColumnName(_c + 1) + (_r + 1),
            getExcelColumnName(_c + cs) + (_r + rs)
          ]);
        }
        let exCell = ws.getCell(getColumnAddress(_c + 1, _r + 1));
        exCell.value = htmldecode(td.innerHTML);
        if (!opts.autoStyle) {
          let styles = getStylesDataAttr(td);
          exCell.font = styles.font || null;
          exCell.alignment = styles.alignment || null;
        }
        // If first row, set width of the columns.
        if (_r == 0)
          ws.columns[_c].width = Math.round(tds[_c].offsetWidth / 7.2); // convert pixel to character width
      }
    }
    // applying merges to the sheet
    merges.forEach(element => {
      ws.mergeCells(element[0] + ":" + element[1]);
    });
    return ws;
  };

  /**
   * Convert HTML special characters back to normal chars
   */
  let htmldecode = (function() {
    let entities = [
      ["nbsp", " "],
      ["middot", "·"],
      ["quot", '"'],
      ["apos", "'"],
      ["gt", ">"],
      ["lt", "<"],
      ["amp", "&"]
    ].map(function(x) {
      return [new RegExp("&" + x[0] + ";", "g"), x[1]];
    });
    return function htmldecode(str) {
      let o = str
        .trim()
        .replace(/\s+/g, " ")
        .replace(/<\s*[bB][rR]\s*\/?>/g, "\n")
        .replace(/<[^>]*>/g, "");
      for (let i = 0; i < entities.length; ++i)
        o = o.replace(entities[i][0], entities[i][1]);
      return o;
    };
  })();

  /**
   * Takes a positive integer and returns the corresponding column name.
   * @param {number} num  The positive integer to convert to a column name.
   * @return {string}  The column name.
   */
  let getExcelColumnName = function(num) {
    for (var ret = "", a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
      ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
    }
    return ret;
  };

  let getColumnAddress = function(col, row) {
    return getExcelColumnName(col) + row;
  };

  let getStylesDataAttr = function(td) {
    //Font attrs
    let font = {};
    if (td.getAttribute("data-f-name"))
      font.name = td.getAttribute("data-f-name");
    if (td.getAttribute("data-f-sz")) font.size = td.getAttribute("data-f-sz");
    if (td.getAttribute("data-f-color"))
      font.color = { argb: td.getAttribute("data-f-color") };
    if (td.getAttribute("data-f-bold") === "true") font.bold = true;
    if (td.getAttribute("data-f-italic") === "true") font.italic = true;
    if (td.getAttribute("data-f-underline") === "true") font.underline = true;
    if (td.getAttribute("data-f-strike") === "true") font.strike = true;

    // Alignment attrs
    let alignment = {};
    if (td.getAttribute("data-a-h"))
      alignment.horizontal = td.getAttribute("data-a-h");
    if (td.getAttribute("data-a-v"))
      alignment.vertical = td.getAttribute("data-a-v");
    if (td.getAttribute("data-a-wrap") === "true") alignment.wrapText = true;
    if (td.getAttribute("data-a-text-rotation"))
      alignment.textRotation = td.getAttribute("data-a-text-rotation");
    if (td.getAttribute("data-a-indent"))
      alignment.indent = td.getAttribute("data-a-indent");
    if (td.getAttribute("data-a-rtl") === "true")
      alignment.readingOrder = "rtl";
    return {
      font,
      alignment
    };
  };

  return methods;
})();

export default TTEParser;
