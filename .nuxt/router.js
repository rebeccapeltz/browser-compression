import Vue from 'vue'
import Router from 'vue-router'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _0ab77174 = () => interopDefault(import('../pages/about.vue' /* webpackChunkName: "pages/about" */))
const _020b3ed4 = () => interopDefault(import('../pages/todos.vue' /* webpackChunkName: "pages/todos" */))
const _8730807c = () => interopDefault(import('../pages/website.vue' /* webpackChunkName: "pages/website" */))
const _2a6f4c39 = () => interopDefault(import('../pages/index.vue' /* webpackChunkName: "pages/index" */))

// TODO: remove in Nuxt 3
const emptyFn = () => {}
const originalPush = Router.prototype.push
Router.prototype.push = function push (location, onComplete = emptyFn, onAbort) {
  return originalPush.call(this, location, onComplete, onAbort)
}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: decodeURI('/'),
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/about",
    component: _0ab77174,
    name: "about"
  }, {
    path: "/todos",
    component: _020b3ed4,
    name: "todos"
  }, {
    path: "/website",
    component: _8730807c,
    name: "website"
  }, {
    path: "/",
    component: _2a6f4c39,
    name: "index"
  }],

  fallback: false
}

export function createRouter () {
  return new Router(routerOptions)
}
