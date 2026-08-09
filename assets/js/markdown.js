(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeUrl(value) {
    const url = String(value || "").trim();
    if (/^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i.test(url)) {
      return escapeHtml(url);
    }
    return "#";
  }

  function inline(source) {
    const codeTokens = [];
    let text = String(source ?? "").replace(/`([^`\n]+)`/g, function (_, code) {
      const token = "\u0000CODE" + codeTokens.length + "\u0000";
      codeTokens.push("<code>" + escapeHtml(code) + "</code>");
      return token;
    });

    text = escapeHtml(text)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, function (_, alt, src, title) {
        const titleAttribute = title ? ' title="' + title + '"' : "";
        return '<img src="' + safeUrl(src) + '" alt="' + alt + '"' + titleAttribute + " loading=\"lazy\">";
      })
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
        const external = /^https?:/i.test(href);
        return '<a href="' + safeUrl(href) + '"' +
          (external ? ' target="_blank" rel="noopener noreferrer"' : "") +
          ">" + label + "</a>";
      })
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, "$1<em>$2</em>")
      .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?:;])/g, "$1<em>$2</em>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>");

    codeTokens.forEach(function (code, index) {
      text = text.replace("\u0000CODE" + index + "\u0000", code);
    });

    return text;
  }

  function splitTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map(function (cell) {
        return cell.trim();
      });
  }

  function isTableDivider(line) {
    const cells = splitTableRow(line);
    return cells.length > 0 && cells.every(function (cell) {
      return /^:?-{3,}:?$/.test(cell);
    });
  }

  function markdown(source) {
    if (!source) return "";

    const lines = String(source).replace(/\r\n?/g, "\n").trim().split("\n");
    const output = [];
    let index = 0;
    let paragraph = [];
    let listType = "";

    function flushParagraph() {
      if (!paragraph.length) return;
      output.push("<p>" + inline(paragraph.join(" ").trim()) + "</p>");
      paragraph = [];
    }

    function closeList() {
      if (!listType) return;
      output.push("</" + listType + ">");
      listType = "";
    }

    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        closeList();
        index += 1;
        continue;
      }

      if (/^```/.test(trimmed)) {
        flushParagraph();
        closeList();
        const language = trimmed.slice(3).trim();
        const code = [];
        index += 1;
        while (index < lines.length && !/^```/.test(lines[index].trim())) {
          code.push(lines[index]);
          index += 1;
        }
        output.push(
          "<pre><code" +
            (language ? ' class="language-' + escapeHtml(language) + '"' : "") +
            ">" +
            escapeHtml(code.join("\n")) +
            "</code></pre>"
        );
        index += 1;
        continue;
      }

      if (trimmed.includes("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
        flushParagraph();
        closeList();
        const headings = splitTableRow(trimmed);
        const alignments = splitTableRow(lines[index + 1]).map(function (cell) {
          if (/^:-+:$/.test(cell)) return "center";
          if (/^-+:$/.test(cell)) return "right";
          return "left";
        });
        const rows = [];
        index += 2;
        while (index < lines.length && lines[index].trim().includes("|")) {
          rows.push(splitTableRow(lines[index]));
          index += 1;
        }
        output.push("<table><thead><tr>");
        headings.forEach(function (heading, cellIndex) {
          output.push('<th style="text-align:' + alignments[cellIndex] + '">' + inline(heading) + "</th>");
        });
        output.push("</tr></thead><tbody>");
        rows.forEach(function (row) {
          output.push("<tr>");
          headings.forEach(function (_, cellIndex) {
            output.push(
              '<td style="text-align:' +
                alignments[cellIndex] +
                '">' +
                inline(row[cellIndex] || "") +
                "</td>"
            );
          });
          output.push("</tr>");
        });
        output.push("</tbody></table>");
        continue;
      }

      const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        closeList();
        const level = heading[1].length;
        output.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
        index += 1;
        continue;
      }

      if (/^([-*_])(?:\s*\1){2,}$/.test(trimmed)) {
        flushParagraph();
        closeList();
        output.push("<hr>");
        index += 1;
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        flushParagraph();
        closeList();
        const quote = [];
        while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
          quote.push(lines[index].trim().replace(/^>\s?/, ""));
          index += 1;
        }
        output.push("<blockquote><p>" + inline(quote.join(" ")) + "</p></blockquote>");
        continue;
      }

      const unordered = trimmed.match(/^[-+*]\s+(.+)$/);
      const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
      if (unordered || ordered) {
        flushParagraph();
        const nextType = ordered ? "ol" : "ul";
        if (listType && listType !== nextType) closeList();
        if (!listType) {
          listType = nextType;
          output.push("<" + listType + ">");
        }
        output.push("<li>" + inline((ordered || unordered)[1]) + "</li>");
        index += 1;
        continue;
      }

      if (listType) closeList();
      paragraph.push(trimmed);
      index += 1;
    }

    flushParagraph();
    closeList();
    return output.join("\n");
  }

  window.WuxingMarkdown = {
    render: markdown,
    escape: escapeHtml
  };
})();
