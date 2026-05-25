const { Plugin } = require("obsidian");

module.exports = class TableHidePlugin extends Plugin {
  async onload() {


    this.allHidden = false;

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

      const cell = target.closest("td");
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
      if (this.isExcludedCell(cell, table)) {
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

      cells.forEach(
        (cell, colIndex) => {
          const excludedColumn =
            excludedColumns[
              colIndex
            ];

          if (
            excludedRow ||
            excludedColumn
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
        }
      );
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