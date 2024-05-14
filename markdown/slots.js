import { h, s } from "hastscript";

export const values = {
  // a string that will create a text node
  title: "A Tale Of Two Cities",

  // a HAST tree that will be inserted
  quote: h("p", "It was the best of times..."),
  svg:   s('svg', {xmlns: 'http://www.w3.org/2000/svg', viewbox: '0 0 100 100'}, [
    s('circle', {cx: 120, cy: 120, r: 100})
  ]) 
};
