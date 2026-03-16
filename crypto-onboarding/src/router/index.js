import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../views/RegisterView.vue'
import ExistingAccountView from '../views/ExistingAccountView.vue'
import PartnersView from '../views/PartnersView.vue'
import ContractView from '../views/ContractView.vue'
import WelcomeView from '../views/WelcomeView.vue'

const routes = [
  { path: '/', component: RegisterView },
  { path: '/existing-account', component: ExistingAccountView },
  { path: '/partners', component: PartnersView },
  { path: '/contract', component: ContractView },
  { path: '/welcome', component: WelcomeView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})