import {glob, watch} from 'node:fs/promises'
import { createReadStream} from 'node:fs'
import {readSync, writeSync} from 'to-vfile'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkSlug from 'remark-slug'
import rehypeStringify from 'rehype-stringify'
import remarkRehype from 'remark-rehype'
import rehypeDocument from 'rehype-document'
import rehypeSortAttributeValues from 'rehype-sort-attribute-values'
import rehypeKatex from 'rehype-katex'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import remarkMath from 'remark-math'
import remarkDirective from 'remark-directive'
import {visit} from 'unist-util-visit'
import {h} from 'hastscript'

function myRemarkPlugin() {
  /**
   * @param {import('mdast').Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    visit(tree, function (node) {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {})
        const hast = h(node.name, node.attributes || {})

        data.hName = hast.tagName
        data.hProperties = hast.properties
      }
    })
  }
}

//for await (const file of glob(`${import.meta.dirname}/data/*.md`)) {
for await (const file of watch(`${import.meta.dirname}/data`)) {
  if (file.filename.endsWith('index.md')) {

  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(myRemarkPlugin)
    .use(remarkMath)
    //.use(remarkSlug)
    //.use(remarkRehype, {allowDangerousHtml: true})
    .use(remarkRehype)
    .use(rehypeRaw)
    .use(rehypeSortAttributeValues)
    .use(rehypeDocument, {
      title: 'Title',
      css: [
        'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css',
        'style.css'
      ],
    })
    .use(rehypeKatex)
    .use(rehypeStringify)

  processor
    .process(readSync(file.filename))
    .then((file) => {
      file.extname = '.html'
      writeSync(file)
    }, (error) => {throw error})
  }


  /*
  const stream = createReadStream(file)
  for await (const chunk of stream) {
    console.log(chunk.toString())
  }
  */
}
  
