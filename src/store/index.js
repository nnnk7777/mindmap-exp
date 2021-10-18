import { createStore } from "vuex";

export default createStore({
  state: {
    mapName: null,
    userName: null,
    userRole: null,
  },
  mutations: {
    SET_MAP_NAME(state, val) {
      state.mapName = val;
    },
    SET_USER_NAME(state, val) {
      state.userName = val;
    },
    SET_USER_ROLE(state, val) {
      state.userRole = val;
    },
  },
  actions: {
    setMapName({ commit }, name) {
      commit("SET_MAP_NAME", name);
    },
    setUserName({ commit }, name) {
      commit("SET_USER_NAME", name);
    },
    setUserRole({ commit }, role) {
      commit("SET_USER_ROLE", role);
    },
  },
});
