const { Plugin } = require("obsidian");

module.exports = class TableHidePlugin extends Plugin {
  async onload() {
    
    this.allHidden = false;

    this.addCommand({
        id: "toggle-hide-cells",
        name: "Toggle Hide Cells",
        hotkeys: [
            {
                modifiers: ["Mod", "Shift"],
                key: "h",
            },
        ],
        callback: () => {
            this.allHidden = !this.allHidden;
            this.updateAllTables();
        },
    });

    // Rest of your code...

    this.lockedColumns = new Set();
    this.lockedRows = new Set();

    // Botón lateral (toggle)
    this.addRibbonIcon(
      "eye-off",
      "Toggle table cells",
      () => {
        this.allHidden = !this.allHidden;
        this.updateAllTables();
      }
    );

    // Detectar clicks en celdas
    this.registerDomEvent(document, "click", (event) => {
      let target = event.target;

      if (!(target instanceof Element)) return;

      const cell = target.closest("td, th");
      if (!cell) return;

      // SOLO Reading View
      const markdownRendered =
        cell.closest(".markdown-reading-view");

      if (!markdownRendered) {
        return;
      }

      const table = cell.closest("table");
      if (!table) return;

      // Ignorar celdas excluidas
      if (
        !event.altKey &&
        this.isExcludedCell(cell, table)
      ) {
        return;
      }

      if (event.altKey) {
        const row = cell.parentElement;
        const cells = Array.from(row.children);
        const colIndex = cells.indexOf(cell);

        const table = cell.closest("table");
        const rows = Array.from(table.querySelectorAll("tr"));

        // Header = bloquear columna
        if (row === rows[0]) {
          if (this.lockedColumns.has(colIndex)) {
            this.lockedColumns.delete(colIndex);
          } else {
            this.lockedColumns.add(colIndex);
          }
        }

        // Primera celda = bloquear fila
        else if (colIndex === 0) {
          const rowIndex = rows.indexOf(row);

          if (this.lockedRows.has(rowIndex)) {
            this.lockedRows.delete(rowIndex);
          } else {
            this.lockedRows.add(rowIndex);
          }
        }

        this.updateAllTables();
        return;
      }
      // Toggle individual
      cell.classList.toggle("hidden-cell");
    });

    // Reaplicar al cambiar de nota/layout
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.updateAllTables();
      })
    );
  }

  updateAllTables() {
  const tables =
    document.querySelectorAll("table");

  tables.forEach((table) => {
    const rows =
      table.querySelectorAll("tr");

    if (!rows.length) return;

    let excludedColumns = [];

    // Detectar columnas bloqueadas
    const headerCells =
      Array.from(rows[0].children);

    excludedColumns =
      headerCells.map((cell) => {
        const text =
          cell.textContent.trim();

        return /^\(\(.+\)\)$/.test(
          text
        );
      });

    rows.forEach((row) => {
      const cells =
        Array.from(row.children);

      if (!cells.length) return;

      const firstCell =
        cells[0];

      const firstText =
        firstCell.textContent.trim();

      const excludedRow =
        /^\(\(.+\)\)$/.test(
          firstText
        );

      const rowIndex = Array.from(rows).indexOf(row);

        cells.forEach((cell, colIndex) => {

          cell.classList.remove(
            "locked-column",
            "locked-row"
          );

          if (this.lockedColumns.has(colIndex)) {
            cell.classList.add("locked-column");
          }

          if (this.lockedRows.has(rowIndex)) {
            cell.classList.add("locked-row");
          }

          const excludedColumn =
            excludedColumns[colIndex];

          const isLockedColumn =
  this.lockedColumns.has(colIndex);

            const isLockedRow =
              this.lockedRows.has(rowIndex);

            if (
              excludedRow ||
              excludedColumn ||
              isLockedRow ||
              isLockedColumn
            ) {
            cell.classList.remove(
              "hidden-cell"
            );

            return;
          }

          cell.classList.toggle(
            "hidden-cell",
            this.allHidden
          );
        });
    });
  });
}
  
  isExcludedCell(cell, table) {
  const rows =
    table.querySelectorAll("tr");

  const row =
    cell.parentElement;

  const cells =
    Array.from(row.children);

  const colIndex =
    cells.indexOf(cell);

  let excludedColumns =
    [];

  if (rows.length) {
    excludedColumns =
      Array.from(
        rows[0].children
      ).map((headerCell) =>
        /^\(\(.+\)\)$/.test(
          headerCell.textContent.trim()
        )
      );
  }

  const firstCellText =
    cells[0]
      ?.textContent
      ?.trim() || "";

  const excludedRow =
    /^\(\(.+\)\)$/.test(
      firstCellText
    );

  return (
    excludedRow ||
    excludedColumns[
      colIndex
    ]
  );
}

}
  ;