import openpyxl
import json

wb = openpyxl.load_workbook('TM-08 (HACKWITHINFY).xlsx', data_only=True)
ws = wb.worksheets[0]
print(f"Sheet: {ws.title}")
for r in range(10, 31):
    row_vals = []
    for c in range(1, 12):
        cell = ws.cell(row=r, column=c)
        val = cell.value
        row_vals.append(val if val else "")
    print(f"Row {r:2d}: {row_vals}")
