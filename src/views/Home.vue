<template>
  <div class="home">
    <div class="formContainer">
      <!-- マップ名を入力 -->
      <p style="font-weight: bold; margin-bottom: 3px;">
        マップ名を入力してください
      </p>
      <input v-model="_mapName" class="textForm" type="text" />
      <!-- 役割を選択 -->
      <div class="radioForm">
        <p style="font-weight: bold; margin-bottom: 3px;">
          プレゼントをあげる側？もらう側？
        </p>
        <input
          v-model="_userRole"
          type="radio"
          name="role"
          id="donor"
          value="donor"
        />
        <label for="donor">あげる</label>
        <input
          v-model="_userRole"
          type="radio"
          name="role"
          id="donee"
          value="donee"
        />
        <label for="donee">もらう</label>
      </div>
      <!-- ユーザ名を入力 -->
      <p style="font-weight: bold; margin-bottom: 3px;">
        名前を入力してください
      </p>
      <input v-model="_userName" class="textForm" type="text" />
      <button class="submitButton" @click="moveToMapPage()">
        作成を始める
      </button>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  data() {
    return {
      _mapName: "",
      _userName: "",
      _userRole: null,
    };
  },
  methods: {
    ...mapActions(["setMapName", "setUserName", "setUserRole"]),
    async moveToMapPage() {
      if (this._mapName && this._userName && this._userRole) {
        await this.setMapName(this._mapName);
        await this.setUserName(this._userName);
        await this.setUserRole(this._userRole);
        await this.$router.push("/map");
      } else {
        alert("入力されていない項目があります");
      }
    },
  },
  computed: {
    ...mapState(["mapName"]),
  },
};
</script>

<style lang="postcss" scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.formContainer {
  display: flex;
  flex-direction: column;
  align-items: center;

  max-width: 500px;
  /* border: solid 1px; */
  padding: 5px;
}

.radioForm {
  padding: 10px 0;
}

.textForm {
  width: 300px;
  height: 20px;
}

.submitButton {
  margin-top: 10px;
}
</style>
