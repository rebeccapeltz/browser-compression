<template>
  <div>
    <h3>Index Module</h3>

    <input type="file" accept="image/*" @change="handleFileChange($event)" />
    <div v-if="originalSrc">
      <img height="200px" :src="originalSrc" />
    </div>
    <div v-if="compressedSrc">
      <img height="200px" :src="compressedSrc" />
    </div>

    <h4>Stats</h4>
    <table class="stats">
      <tr v-if="stats && stats.length > 0">
        <th>Original File Size</th>
        <th>Compressed File Size</th>
        <th>Compressed File</th>
      </tr>
      <tr v-for="(stat, index) in stats" :key="index">
        <td>{{ stat.data.original.toFixed(2) }}MB</td>
        <td>{{ stat.data.compressed.toFixed(2) }}MB</td>
        <td><img width="150" :src="stat.data.src" /></td>
      </tr>
    </table>
  

    <br />
    <!-- <button @click="increment">
      {{ counter }}
    </button> -->
    <br />
    <NuxtLink to="/about"> About </NuxtLink>
    <br />
    <br />
    <h3>Todo Module</h3>
    <NuxtLink to="/todos"> Todos </NuxtLink>
    <br />
    <br />
    <h3>Nested Modules</h3>
    <NuxtLink to="/website"> Website </NuxtLink>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";
import imageCompression from "browser-image-compression";

export default {
  // fetch(context) is called by the server-side
  // and before instantiating the component
  fetch({ store }) {
    store.commit("increment");
  },
  computed: mapGetters({
    stats: "stats/stats",
  }),
  data: function () {
    return {
      originalSrc: undefined,
      compressedSrc: undefined,
    };
  },
  // computed: mapState(["counter"]),
  methods: {
    increment() {
      this.$store.commit("increment");
    },

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
    async handleFileChange(event) {
      try {
        const imageFile = event.target.files[0];

        //add these stats to store
        const originalSize = imageFile.size / 1024 / 1024;
        console.log("originalFile instanceof Blob", imageFile instanceof Blob); // true
        console.log(`originalFile size ${originalSize} MB`);
        this.originalSrc = await this.readAsDataURL(imageFile);
        // console.log(this.originalSrc);

        //compress
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(imageFile, options);
        const compressedSize = compressedFile.size / 1024 / 1024;
        this.compressedSrc = await this.readAsDataURL(compressedFile);
        console.log(`compressedFile size ${compressedSize} MB`);

        // const data = {
        //   original: originalSize,
        //   compressed: compressedSize,
        //   url:
        //     "https://images.pexels.com/photos/5198585/pexels-photo-5198585.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
        // };
        const data = {
          original: originalSize,
          compressed: compressedSize,
          src: this.compressedSrc,
        };
        this.$store.commit("stats/add", data);
      } catch (error) {
        console.log(error);
      }
    },

    addStats(e) {
      const data = {};
      this.$store.commit("stats/add", data);
      const text = e.target.value;
      if (text.trim()) {
        this.$store.commit("todos/add", { text });
      }
      e.target.value = "";
    },
  },
};
</script>
<style scoped>
table {
  border-collapse: collapse;
  border: 1px solid black;
}

th,
td {
  border: 1px solid black;
}
table.stats {
  text-align: center;
  table-layout: auto;
  width: 100%;
}
</style>