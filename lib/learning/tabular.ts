import { inflateRawSync } from 'node:zlib';
import { fail } from '../student/security';
export function parseCSV(text: string) { const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false; for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
        if (quoted && text[i + 1] === '"') {
            cell += '"';
            i++;
        }
        else
            quoted = !quoted;
    }
    else if (c === ',' && !quoted) {
        row.push(cell); if(row.length>100)fail(400,'Import at most 100 columns.');
        cell = '';
    }
    else if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && text[i + 1] === '\n')
            i++;
        row.push(cell);
        if (row.some(Boolean))
            rows.push(row); if(rows.length>1001)fail(400,'Import at most 1000 questions per file.');
        row = [];
        cell = '';
    }
    else
        cell += c;
} if (quoted)
    fail(400, 'Unclosed CSV quotation.'); row.push(cell); if (row.some(Boolean))
    rows.push(row); if(rows.length>1001)fail(400,'Import at most 1000 questions per file.'); return rows; }
export function csv(rows: string[][]) { return '\uFEFF' + rows.map(row => row.map(s => { if (/^[=+@\-\t\r]/.test(s))
    s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; }).join(',')).join('\r\n'); }
const xml = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const unxml = (s: string) => s.replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi, (_, code, name) => code ? String.fromCodePoint(Math.min(0x10ffff, code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code))) : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[name.toLowerCase()]);
const column = (n: number) => { let s = ''; for (n++; n; n = Math.floor((n - 1) / 26))
    s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
function crc(data: Buffer) { let c = 0xffffffff; for (const byte of data) {
    c ^= byte;
    for (let i = 0; i < 8; i++)
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
} return (c ^ 0xffffffff) >>> 0; }
export function xlsx(rows: string[][]) { const files: Record<string, string> = { '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>', '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>', 'xl/workbook.xml': '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Questions" sheetId="1" r:id="rId1"/></sheets></workbook>', 'xl/_rels/workbook.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>', 'xl/worksheets/sheet1.xml': '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + rows.map((row, r) => '<row r="' + (r + 1) + '">' + row.map((cell, c) => '<c r="' + column(c) + (r + 1) + '" t="inlineStr"><is><t xml:space="preserve">' + xml(cell) + '</t></is></c>').join('') + '</row>').join('') + '</sheetData></worksheet>' }; const chunks: Buffer[] = [], central: Buffer[] = []; let offset = 0; for (const [name, text] of Object.entries(files)) {
    const nameBuffer = Buffer.from(name), data = Buffer.from('<?xml version="1.0" encoding="UTF-8"?>' + text), checksum = crc(data), header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBuffer.length, 26);
    chunks.push(header, nameBuffer, data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt32LE(checksum, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBuffer.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBuffer);
    offset += 30 + nameBuffer.length + data.length;
} const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16); return Buffer.concat([...chunks, directory, end]); }
export function parseXLSX(bytes: Buffer) {
    let end = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
        if (bytes.readUInt32LE(i) === 0x06054b50) {
            end = i;
            break;
        }
    if (end < 0)
        fail(400, 'Invalid XLSX archive.');
    const count = bytes.readUInt16LE(end + 10), start = bytes.readUInt32LE(end + 16);
    if (count > 2000)
        fail(400, 'XLSX archive has too many entries.');
    const files = new Map<string, string>();
    let position = start, total = 0;
    for (let i = 0; i < count; i++) {
        if (position + 46 > bytes.length || bytes.readUInt32LE(position) !== 0x02014b50)
            fail(400, 'Invalid XLSX directory.');
        const method = bytes.readUInt16LE(position + 10), size = bytes.readUInt32LE(position + 20), expanded = bytes.readUInt32LE(position + 24), nameLength = bytes.readUInt16LE(position + 28), extra = bytes.readUInt16LE(position + 30), comment = bytes.readUInt16LE(position + 32), offset = bytes.readUInt32LE(position + 42), name = bytes.subarray(position + 46, position + 46 + nameLength).toString('utf8');
        position += 46 + nameLength + extra + comment;
        if (/vbaproject/i.test(name))
            fail(400, 'Macros are not supported.');
        if (!['xl/sharedStrings.xml', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels'].includes(name) && !/^xl\/worksheets\/sheet\d+\.xml$/.test(name))
            continue;
        total += expanded;
        if (expanded > 12 * 1024 * 1024 || total > 24 * 1024 * 1024 || offset + 30 > bytes.length)
            fail(400, 'Expanded XLSX exceeds the size limit.');
        const dataOffset = offset + 30 + bytes.readUInt16LE(offset + 26) + bytes.readUInt16LE(offset + 28);
        if (dataOffset + size > bytes.length)
            fail(400, 'Invalid XLSX entry.');
        const input = bytes.subarray(dataOffset, dataOffset + size), output = method === 0 ? input : method === 8 ? inflateRawSync(input, { maxOutputLength: 12 * 1024 * 1024 }) : null;
        if (!output)
            fail(400, 'Unsupported XLSX compression.');
        const text = output.toString('utf8');
        if (/<!DOCTYPE|<!ENTITY/i.test(text))
            fail(400, 'Unsafe XML declarations.');
        files.set(name, text);
    }
    const strings = [...(files.get('xl/sharedStrings.xml') || '').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m => [...m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t => unxml(t[1])).join(''));
    const sheet = files.get('xl/worksheets/sheet1.xml') || [...files.entries()].find(([n]) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))?.[1];
    if (!sheet)
        fail(400, 'No worksheet found.');
    const rows: string[][] = [];
    for (const match of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
        const row: string[] = [];
        for (const cell of match[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
            if (/<f\b/.test(cell[2]))
                fail(400, 'Import values only; remove spreadsheet formulas first.');
            const ref = cell[1].match(/\br="([A-Z]+)\d+"/)?.[1] || column(row.length);
            let index = 0;
            for (const c of ref)
                index = index * 26 + c.charCodeAt(0) - 64;
            index--;
            if (index > 100)
                fail(400, 'Too many import columns.');
            const value = cell[2].match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] || '';
            row[index] = /\bt="s"/.test(cell[1]) ? strings[Number(value)] || '' : /\bt="inlineStr"/.test(cell[1]) ? [...cell[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t => unxml(t[1])).join('') : unxml(value);
        }
        if (row.some(Boolean))
            rows.push(Array.from({ length: row.length }, (_, i) => row[i] || ''));
        if (rows.length > 1001)
            fail(400, 'Import at most 1000 questions per file.');
    }
    return rows;
}
