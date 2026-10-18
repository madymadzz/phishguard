import fs from "fs";
import path from "path";

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAAB/Pny7AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJUExURQALX////wAAAFlV86QAAAAHdElNRQfmChISACpT9H74AAAALUlEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwDQ8cAAHRuO8vAAAAAElFTkSuQmCC";
const buffer = Buffer.from(pngBase64, "base64");

fs.writeFileSync(path.join("public", "icons", "icon-192.png"), buffer);
fs.writeFileSync(path.join("public", "icons", "icon-512.png"), buffer);
fs.writeFileSync(path.join("public", "brand", "logo.png"), buffer);

console.log("Placeholder icons generated successfully.");
