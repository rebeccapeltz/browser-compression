# Experimenting with Browser Compression

No matter how you store images served for you website, it can save time and money to let the browser perform
compression.

This page allows you to experiment with browsers compression. On the Home
page you can upload images of various sizes and see the effect of compressing
them.

## Sandbox
You can access this sandbox code to follow along.  There are 2 routes: Home and About.  All of the code regarding browser compression can be found in the `pages/index.vue` of this Nuxt project.

<iframe src="https://codesandbox.io/embed/rpeltz-nuxt-browser-compression-go7v1?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="rpeltz-nuxt-browser-compression"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

## How is browser compression accomplished?
The compression is performed using the quality option of the Canvas to Data URL method
found in the [HTMLCanvasElement object](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL).


The code that facilitates this is imported from the [browser-image-compression](https://www.npmjs.com/package/browser-image-compression) npm package. If you look into the npm package's `canvasToFile` function in the [util.js](https://github.com/Donaldcwl/browser-image-compression/blob/master/lib/utils.js) you can see that the quality is a variable.  
```js
export async function canvasToFile (canvas, fileType, fileName, fileLastModified, quality = 1) {
  let file
  if (typeof OffscreenCanvas === 'function' && canvas instanceof OffscreenCanvas) {
    file = await canvas.convertToBlob({ type: fileType, quality })
    file.name = fileName
    file.lastModified = fileLastModified
  } else {
    const dataUrl = canvas.toDataURL(fileType, quality)
    file = await getFilefromDataUrl(dataUrl, fileName, fileLastModified)
  }
  return file
}
```

For jpg images, quality is set to 95% of its original value.

```js
if (file.type === 'image/jpeg') {
  quality *= 0.95
}
```

In the [image-compression.js](https://github.com/Donaldcwl/browser-image-compression/blob/master/lib/image-compression.js) file, you can see that quality is being set at 0.95.  This lowering of quality in the call to


      <p>The code uses the readAsDataURL method in the FileReader API to get the contents of the image file

## How is browser compression used in this web page?

In this web page, we want to experiment and report on the effects of the browser compression library.  We're using Nuxt as it promotes best practice for the Vue.js framework using "convention over configuration" to set up routing.  In particular we achieve cross page and cross component reactive data access by using the Vuex store.  We set up a `list` that will hold instances of an implicit schema for the following data:

* original file size
* compressed file size
* base64 data for compressed file

Note that no file upload is used in this example.  All data is stored in memory and managed using getters and (synchronous) mutations.

`state.js` defines state as a list.

```js
export default () => ({
  list: []
})
```

`getters.js` returns the list.

```js
export default {
  stats (state) {
    return state.list
  }
}
```

`mutations` provides a way to add object to the list.

```js
export default {
  // data = {original:n, compressed:n, url:xxx}
  add (state, data ) {
    state.list.push({
      data
    })
  }
}
```

## How to perform experiments?

This list of data accumulates at the user interacts with the web page via the upload button.  

1. User selects a file to compress using the upload button
1. The `change` event is triggered after the user selects a file.
1. The `change` event handler extracts the file from the event and obtains original size
1. Contents of original file is converted to a URL using a local `readDataAsUrl` function so that it can be bound to an `img` DOM element
1. Compression is performed using the `browser-image-compression` library and a new file object is referenced as `compressedFile`
1. Size of compress file is assessed and referenced as `compressedSize`
1. Contents of compressed file is converted to a URL using a local `readDataAsUrl` function so that it can be bound to an `img` DOM element
1. The original and compressed files are rendered on the page for comparison.
<img src="https://res.cloudinary.com/pictures77/image/upload/v1600718208/jam/image-compare-compression.png" alt="Original vs Compressed Image" width="320">
1. Data (an object containing originalSize, compressedSize and compressedImage) is published to the store.
1. A table that renders the DOM is updated by the store and serves as a way to record experiment results.
![Experimental Results](https://res.cloudinary.com/pictures77/image/upload/v1600718283/jam/table-compare-compression.png)

## How is base64 image converted to a URL?

Data uploaded from an file input is in the form of [file input object](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file).  In the case of the original file, we were able to determine the size of the file by checking the file input object size property.  In order to bind the image represented by the file input object, we had to use the File Reader API and access the URL to the file from the input object and get the underlying base64 data.

We created a function that returns a promise to use the File Reader API to get the contents from the URL. We can code this in vue.js/Nuxt as a method for the component.  We reject if there's an error reading, we reject.  If the read is successful we handle the `onloadend` event and resolve the file reader result, which is a base64 data that can be bound to the DOM via the image src attribute.

```js
readAsDataURL(inputFile) {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onerror = () => {
        fileReader.abort();
        reject(new DOMException("Problem parsing input file."));
      };
      fileReader.onloadend = () => {
        resolve(fileReader.result);
      };
    fileReader.readAsDataURL(inputFile);
    });
  },

```
#### Binding to the DOM
We have set up two reactive data items in the `index.vue` data section.  Initially these are undefined and because the `img` tags use `v-if` based on the values of this data, neither the original, nor compressed image is rendered.  

Once we have obtained the data using the File Reader API, we can add it to these data references and the images will be rendered.

```js
data: function() {
  return {
    originalSrc: undefined,
    compressedSrc: undefined
  };
},
```

```js
this.originalSrc = await this.readAsDataURL(imageFile);
```

We obtain a compressed file object as the output of the call to `imageCompression` the file.
We first supply some options to direct compression and then we get a file input object similar to what the file input form control provides.  In addition to quality we can set some max size, height and width on the file to be compressed.

Once we have the compressed file input object, we can call upon the FileReader API to give us base64 data that we can bind to the DOM image `src` attribute.

```js
const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};
const compressedFile = await imageCompression(imageFile, options);
const compressedSize = compressedFile.size / 1024 / 1024;
this.compressedSrc = await this.readAsDataURL(compressedFile);
```


