<template>
  <div class="clip">
      <img :src="avatar" alt="" id="img"/>
      <input type="file" accept="image/png,image/jpg,image/jpeg" @change="change($event)" class="clip-image">
  </div>
</template>

<script>
/* eslint-disable */

import Vue from 'vue';
import clipper from './clip.js';
import './_clip.scss';
import './_clip-cut.scss';

Vue.config.productionTip = false;
Vue.use(clipper);

export default {
    data() {
        return {

        };
    },
    props: {
        avatar: {
            type: String
        },
        loading: {

        }
    },
    methods: {
        change(event) {
            const image = document.getElementById('img'); // 预览对象
            this.clip(event, {
                resultObj: image,
                aspectRatio: 1
            });
        }
    }
};

</script>
