# Experimenting with Browser Compression

No matter how we store images served on the web, we can save time and money by letting the browser perform compression.  

The Nuxt app described here allows us to experiment with browser compression. On the Home
page you can select images of various sizes and see the effect of compressing them.  You can also build a table that compares the image original size to its compressed size.  

This app doesn't involve uploading images.  It runs code that compresses images and shows the results.  This code could be worked into a an upload workflow.

## Sandbox
This code described in this blog is available on [Codesandbox](https://codesandbox.io/s/rpeltz-nuxt-browser-compression-go7v1?file=/pages/index.vue:3136-3145). You can access this sandbox code to follow along.  There are 2 routes: Home and About.  All of the code regarding browser compression can be found in the `pages/index.vue` of this Nuxt project.

<iframe src="https://codesandbox.io/embed/rpeltz-nuxt-browser-compression-go7v1?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="rpeltz-nuxt-browser-compression"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

## How is browser compression accomplished?
The compression is performed using the quality option of the Canvas to Data URL method
found in the [HTMLCanvasElement object](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL).


The code that facilitates this is imported from the [browser-image-compression](https://www.npmjs.com/package/browser-image-compression) library. If you look into the library's `canvasToFile` function in the [util.js](https://github.com/Donaldcwl/browser-image-compression/blob/master/lib/utils.js) you can see that the quality is a variable.  

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

For jpg images, quality is set to 95% of its original value. In the [image-compression.js](https://github.com/Donaldcwl/browser-image-compression/blob/master/lib/image-compression.js) file, you can see that quality is being set at 0.95.  This lowering of quality in the call to

```js
if (file.type === 'image/jpeg') {
  quality *= 0.95
}
```

## How is browser compression used in this app?

In this app, we want to experiment and report on the effects of the browser compression library.  We're using Nuxt as it promotes best practice for the Vue.js framework using "convention over configuration" to set up routing and internal data storage.  In particular we achieve cross page and cross component reactive data access by using the Vuex store.  We set up a `list` that will hold instances of an implicit schema for the following data:

* original file size
* compressed file size
* base64 data for compressed file

As we select files for compression we keep a list of this data and report it in tabular form.


Note that no file upload is used in this example.  All data is stored in memory and managed using getters and (synchronous) mutations.

`stats/state.js` defines state as a list.

```js
export default () => ({
  list: []
})
```

`stats/getters.js` returns the list.

```js
export default {
  stats (state) {
    return state.list
  }
}
```

`stats/mutations.js` provides a way to add object to the list.

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

This list of data accumulates as the user interacts with the app via the **Choose File**  button.  

1. User selects a file to compress using the **Choose File** button
1. The `change` event is triggered after the user selects a file.
1. The `change` event handler extracts the file from the event and obtains original size
1. Contents of original file is converted to a URL using a local `readDataAsUrl` function so that it can be bound to an `img` DOM element
1. Compression is performed using the `browser-image-compression` library and a new file object is referenced as `compressedFile`
1. Size of compress file is assessed and referenced as `compressedSize`
1. Contents of compressed file is converted to a URL using a local `readDataAsUrl` function so that it can be bound to an `img` DOM element
1. The original and compressed files are rendered on the page for comparison.
  <img src="https://res.cloudinary.com/pictures77/image/upload/v1600718208/jam/image-compare-compression.png" alt="Original vs Compressed Image" width="320">
1. Data (an object containing originalSize, compressedSize and compressedImage) is published to the Vuex store.
1. A table that renders the DOM is updated by the store and serves as a way to record experiment results.
![Experimental Results](https://res.cloudinary.com/pictures77/image/upload/v1600718283/jam/table-compare-compression.png)

## How is base64 image converted to a URL?

Data uploaded from file input is in the form of [file input object](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file).  In the case of the original file, we were able to determine the size of the file by checking the file input object size property. We obtain a single from from the `event.target.files` array and then divide by 1 million to get a size in megabytes. 


```js
const imageFile = event.target.files[0];
onst originalSize = imageFile.size / 1024 / 1024;
```


In order to bind the image represented by the file input object, we had to use the File Reader API and access the URL to the file from the input object and get the underlying base64 data.


We created a function that returns a promise. The function uses the File Reader API to get the contents from the URL. We can code this in vue.js/Nuxt as a method for the component.  We reject if there's an error reading.  If the read is successful we handle the `onloadend` event and resolve the file reader result, which is base64 data that can be bound to the DOM via the image `src` attribute.

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


#### How to bind image file input objects to the DOM?

We have set up two reactive data items in the `index.vue` data section.  Initially these are undefined and because the `img` tags use `v-if` based on the values of this data, neither the original, nor compressed image is rendered.  


```js
data: function() {
  return {
    originalSrc: undefined,
    compressedSrc: undefined
  };
},
```


Once we have obtained the data using the File Reader API, we can add it to these data references and the images will be rendered.  This takes place in the file input change handler which is declare async and therefore able to `await` the function that is returning a promise.

```js
async handleFileChange(event) {
```
...

```js
this.originalSrc = await this.readAsDataURL(imageFile);
```

We obtain a compressed file object as the output of the call to `imageCompression` the file.
We first supply some options and then we get a file input object similar to what the **Choose File** input tag provides.  

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

## What's next?

The next step in this analytic process would be to upload the image to a an online storage area such as [Cloudinary](https://www.cloudinary.com) or [Imgur](https://www.imgur.com). This would allow us to save information about our compression in a database.  We could store the options, sizes and a URL instead of the base64 image data and analyze more thoroughly the effect of Canvas options and quality values on browser compression. 
