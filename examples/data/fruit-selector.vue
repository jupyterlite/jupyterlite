<template>
  <div>
    <v-select label="Fruits" :items="fruits" v-model="selected" />
    <div>
      <v-btn @click="addBanana" :disabled="hasBanana">Add banana</v-btn>
      <v-btn @click="removeBanana" :disabled="!hasBanana">Remove banana</v-btn>
      <v-btn @click="add_fruit_python()" :disabled="!can_add_from_python"
        >Add from Python</v-btn
      >
    </div>
    Available fruits
    <table class="fruit-selector-file">
      <tr
        v-for="(fruit, index) in fruits"
        :key="index"
        @click="selected = fruit"
      >
        <td>{{ index }}</td>
        <td>{{ fruit }}</td>
        <td class="selected">
          <v-icon v-if="fruit == selected" left color="green">
            mdi-check
          </v-icon>
          <v-icon v-if="fruit != selected" left color="grey">
            mdi-check
          </v-icon>
        </td>
      </tr>
    </table>
  </div>
</template>
<style id="fruit-selector-style-file">
.fruit-selector-file td {
  border: 1px solid #999;
  padding: 5px 10px;
}
.fruit-selector-file {
  border-collapse: collapse;
}
.fruit-selector-file td.selected {
  width: 50px;
}
</style>
<script>
module.exports = {
  methods: {
    addBanana() {
      this.fruits.push("Banana");
    },
    removeBanana() {
      this.fruits.pop("Banana");
      if (this.selected == "Banana") {
        this.selected = null;
      }
    },
  },
  computed: {
    hasBanana() {
      return this.fruits.includes("Banana");
    },
  },
  watch: {
    fruits() {
      console.log("Current fruits", this.fruits);
      console.log("Has banana", this.hasBanana());
    },
  },
};
</script>
