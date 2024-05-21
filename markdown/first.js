import { glob, watch } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { readSync, writeSync } from "to-vfile";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkSlug from "remark-slug";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import rehypeDocument from "rehype-document";
import rehypeSortAttributeValues from "rehype-sort-attribute-values";
import rehypeKatex from "rehype-katex";
import rehypeParse from "rehype-parse";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import { h, s } from "hastscript";
import rehypeSlots from "rehype-slots";
//import {values} from "./slots.js"
import rehypeFormat from 'rehype-format'
//import codeblocks from 'remark-code-blocks'
import { execSync } from 'child_process'
import "katex/dist/contrib/mhchem.mjs";

let chemfigN = 0
let currentFile =""

function myRemarkPlugin() {
  return function(tree) {
    visit(tree, function(node) {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        if (node.name === "chemfig") {
          chemfigN++
          let text = node.children[0].children[0].value
          execSync(`
          latex -output-format=dvi << END
          \\documentclass{article}
          \\usepackage{chemfig,chemmacros}
          \\usepackage[version=4]{mhchem}
          \\usepackage{tcolorbox}
          \\begin{document}
          \\newtcbox{\\mybox}{opacityframe=0,opacityback=0}
          \\hoffset=-1in
          \\voffset=-1in
          \\setbox0\\hbox{
          \\mybox{
          ${text}
          }
          }
          \\shipout\\box0
          \\stop
          END
          `
            , { encoding: 'utf-8' })
          execSync(`dvisvgm texput.dvi --stdout > ./data/pages/${currentFile}-${chemfigN}.svg`
            , { encoding: 'utf-8' })
          const data = node.data || (node.data = {});
          const hast = h('img', { src: `${currentFile}-${chemfigN}.svg` });
          data.hName = hast.tagName;
          data.hProperties = hast.properties;
          node.children = []
          return
        }
        const data = node.data || (node.data = {});
        const hast = h(node.name, node.attributes || {});

        data.hName = hast.tagName;
        data.hProperties = hast.properties;
      }

    });
  };
}

//for await (const file of glob(`${import.meta.dirname}/data/*.md`)) {
for await (const file of watch(`${import.meta.dirname}/in`)) {
  console.log(file.filename)
  currentFile = file.filename.split(".")[0]
  //console.log(file.filename.split("."))
  //console.log(`${process.argv[2]}`)
  if (file.filename.endsWith('m4d')) {
    console.log("process:", file.filename)
    chemfigN = 0
    execSync(`awk -f process0.awk in/${file.filename} | m4 -R def.m4f > data/index.md`)
    const processor = unified()
      .use(remarkParse)
      /*
        .use(codeblocks, {
          lang: "chemfig",
          formatter: (a) => a.toUpperCase()
        })
        */
      .use(remarkMath)
      .use(remarkDirective)
      .use(myRemarkPlugin)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      //.use(rehypeSlots, { values })
      //.use(rehypeSortAttributeValues)
      .use(rehypeDocument, {
        title: "Title",
        css: [
          "https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css",
          "style.css",
        ],
      })
      .use(rehypeKatex)
      .use(rehypeStringify)

    processor.process(readSync('index.md')).then(
      (out) => {
        //values.codeblock=file.data.codeblocks[0]
        //console.log(file.data.codeblocks)
        out.history = [out.history[0], `data/pages/${file.filename.split(".")[0]}.html`]
        writeSync(out);
      },
      (error) => {
        throw error;
      },
    );
  }

  /*
  const stream = createReadStream(file)
  for await (const chunk of stream) {
    console.log(chunk.toString())
  }
  */
}
