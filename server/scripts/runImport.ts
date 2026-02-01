import { importMedicinesFromCSV } from "./importMedicinesFromCSV";

(async () => {
  await importMedicinesFromCSV();
  console.log("✅ Medicine import finished. Exiting.");
  process.exit(0);
})();