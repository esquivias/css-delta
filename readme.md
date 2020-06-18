# CSS Delta

Capture the difference between two analogous stylesheets.

## Installation

`npm install -g css-delta`

## Usage

The command `css-delta` is available upon installation with the following options:

```
-f, --from      [required]
-t, --to        [required]
-o, --output    [optional]
```

### Example

`css-delta -from original.css -to modified.css -output difference.css`

## Attribution

This is a port of [CSSCompare](https://github.com/bertjohnson/CSSCompare) developed by [Bert Johnson](https://bertjohnson.com/) along with contributions by [Hall](https://github.com/dougahall) and [Zhang](https://github.com/545034298).

## License

Copyright &copy; 2011-2015 Bert Johnson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
