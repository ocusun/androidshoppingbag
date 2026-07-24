import { cp, rm } from "node:fs/promises";

const repositoryRoot = new URL("../", import.meta.url);
const distRoot = new URL("../dist/", import.meta.url);

for (const directory of ["assets", "content", "webtoon"]) {
  await rm(new URL(`${directory}/`, repositoryRoot), {
    recursive: true,
    force: true,
  });
  await cp(new URL(`${directory}/`, distRoot), new URL(`${directory}/`, repositoryRoot), {
    recursive: true,
  });
}

for (const file of ["index.html", "privacy.html", "terms.html", "favicon.svg"]) {
  await cp(new URL(file, distRoot), new URL(file, repositoryRoot));
}
