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

let values = {
  // a string that will create a text node
  title: "A Tale Of Two Cities",

  // a HAST tree that will be inserted
  quote: h("p", "It was the best of times..."),
  svg:   s('svg', {xmlns: 'http://www.w3.org/2000/svg', viewbox: '0 0 100 100'}, [
    s('circle', {cx: 120, cy: 120, r: 100})
  ]) 
};

let chemfigN = 0

function myRemarkPlugin() {
  return function (tree) {
    visit(tree, function (node) {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        if (node.name === "chemfig"){
          chemfigN++
          let text = node.children[0].children[0].value
          execSync(`
          dvilualatex << END
          \\documentclass{article}
          \\usepackage{chemfig}
          \\begin{document}
          ${text}
          \\end{document}
          END
          `
          , {encoding: 'utf-8'})
          execSync(`dvisvgm texput.dvi --stdout  --exact-bbox > ./data/chemfig${chemfigN}.svg`
          , {encoding: 'utf-8'})
        const data = node.data || (node.data = {});
        const hast = h('img', {src: `chemfig${chemfigN}.svg`});
        data.hName = hast.tagName;
        data.hProperties = hast.properties;
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
for await (const file of watch(`${import.meta.dirname}/data`)) {
  if (file.filename.endsWith("index.md")) {
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
      .use(remarkRehype, {allowDangerousHtml: true})
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

    processor.process(readSync(file.filename)).then(
      (file) => {
        //values.codeblock=file.data.codeblocks[0]
        //console.log(file.data.codeblocks)
        file.extname = ".html";
        writeSync(file);
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
