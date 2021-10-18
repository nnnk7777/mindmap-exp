<template>
  <div class="map">
    <div v-if="this.isFilledState">
      <div v-if="this.loaded" class="mapContainer">
        <!-- マインドマップ -->
        <v-network-graph
          :nodes="nodes"
          :edges="edges"
          :layouts="layouts"
          :configs="configs"
          :event-handlers="eventHandlers"
        />
        <!-- 右のUIパネル -->
        <div class="formPanel">
          <p>you are {{ this.userRole }}</p>
          <!-- 追加するノードの親の名前 -->
          <p style="font-weight: bold; display: flex; flex-direction: column">
            <span>
              どのノードの下に
            </span>
            <span>
              データを追加しますか？
            </span>
          </p>
          <p v-if="selectedNode">{{ this.selectedNode.Label }}</p>
          <p v-else style="color: red">未選択</p>

          <!-- 追加する名前の入力 -->
          <p style="font-weight: bold;  display: flex; flex-direction: column">
            <span>追加するノード名を</span>
            <span>入力してください</span>
          </p>
          <input v-model="newNodeLabel" type="text" />

          <!-- 形状の選択 -->
          <p style="font-weight: bold;">形状を選択してください</p>
          <div>
            <input
              v-model="newNodeShape"
              type="radio"
              name="shape"
              id="rect"
              value="rect"
            />
            <label for="rect">四角</label>
            <input
              v-model="newNodeShape"
              type="radio"
              name="shape"
              id="circle"
              value="circle"
            />
            <label for="circle">丸</label>
          </div>

          <!-- 追加ボタン -->
          <button @click="addNewNode()">Add</button>
        </div>
      </div>
    </div>
    <div v-else>
      <p>マップ名などが入力されていません</p>
      <router-link to="/">トップに戻る</router-link>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { GridLayout } from "v-network-graph";

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

export default {
  name: "Map",
  data() {
    return {
      eventHandlers: null,
      fireData: null,
      fireDB: null,
      loaded: false,
      selectedNodeID: null,
      newNodeLabel: null,
      newNodeShape: null,
    };
  },
  methods: {
    addNewNode() {
      let diffX;
      if (this.selectedNodeID > 0) {
        diffX = this.selectedNode.PosX > 0 ? 100 : -100;
      } else {
        if (this.userRole == "donor") {
          diffX = 100;
        } else if (this.userRole == "donee") {
          diffX = -100;
        }
      }
      let diffY = Math.random() * (50 + 50) - 50;

      const db = getFirestore();
      if (this.selectedNodeID && this.newNodeLabel && this.newNodeShape) {
        addDoc(collection(db, "nodes"), {
          ID: this.fireData.length,
          Label: this.newNodeLabel,
          MapName: this.mapName,
          Parent: this.selectedNodeID,
          PosX: this.selectedNode.PosX + diffX,
          PosY: this.selectedNode.PosY + diffY,
          Shape: this.newNodeShape,
          User: this.userName,
        });
      } else {
        alert("未入力の項目があります");
      }
    },
  },
  computed: {
    ...mapState(["mapName", "userName", "userRole"]),
    isFilledState() {
      if (this.mapName && this.userName && this.userRole) {
        return true;
      } else {
        return false;
      }
    },
    selectedNode() {
      if (this.fireData.length > 0 && this.selectedNodeID) {
        return this.fireData.filter((fire) => {
          return fire.ID == this.selectedNodeID;
        })[0];
      } else {
        return null;
      }
    },
    nodes() {
      let _nodes = {};
      if (this.fireData.length > 0) {
        this.fireData.forEach((d) => {
          let tmp = {};
          tmp.name = d.Label;
          if (d.Shape) tmp.type = d.Shape;
          if (d.Color) tmp.color = d.Color;
          if (d.Draggable != null) tmp.draggable = d.Draggable;
          _nodes[`node${d.ID}`] = tmp;
        });
      }
      return _nodes;
    },
    edges() {
      let _edges = {};
      if (this.fireData.length > 0) {
        this.fireData.forEach((d) => {
          if (d.Parent != null) {
            let tmp = {};
            tmp.source = `node${d.Parent}`;
            tmp.target = `node${d.ID}`;
            _edges[`edge${d.ID}`] = tmp;
          }
        });
      }
      return _edges;
    },
    layouts() {
      let _layouts = {};
      if (this.fireData.length > 0) {
        this.fireData.forEach((d) => {
          let tmp = {};
          tmp.x = d.PosX;
          tmp.y = d.PosY;
          _layouts[`node${d.ID}`] = tmp;
        });
      }
      return { nodes: _layouts };
    },
    configs() {
      return {
        node: {
          normal: {
            type: (node) => node.type || "circle",
            color: (node) => node.color || "#4466cc",
          },
        },
        view: {
          layoutHandler: new GridLayout({ grid: 10 }),
        },
      };
    },
  },
  watch: {
    async fireData() {
      let setLoaded = async (bool) => {
        this.loaded = bool;
      };
      await setLoaded(false);
      await setLoaded(true);
    },
  },
  async created() {
    const db = getFirestore();

    if (this.isFilledState) {
      const queryForCheck = query(
        collection(db, "nodes"),
        where("MapName", "==", this.mapName)
      );
      const isEmptyDocument = await getDocs(queryForCheck);
      if (isEmptyDocument.empty) {
        addDoc(collection(db, "nodes"), {
          ID: 0,
          Color: "#cc4444",
          Label: "root",
          MapName: this.mapName,
          Parent: null,
          PosX: 0,
          PosY: 0,
          Shape: "rect",
          Type: null,
          User: null,
        });
      }

      const q = query(
        collection(db, "nodes"),
        where("MapName", "==", this.mapName)
      );
      this.fireDB = onSnapshot(q, (querySnapshot) => {
        this.loaded = false;
        let tmp = [];
        querySnapshot.forEach((doc) => {
          let obj = doc.data();
          Object.assign(obj, { firebaseID: doc.id });
          tmp.push(obj);
        });
        this.fireData = tmp;
        this.loaded = true;
      });

      this.eventHandlers = {
        "node:click": ({ node }) => {
          // 現在選択されているノードのIDを取得
          this.selectedNodeID = node.replace("node", "");
        },
        "node:dragend": async (node) => {
          // 位置座標をアップデート
          const db = getFirestore();
          let updateNodeID = Object.keys(node)[0].replace("node", "");
          let updateFirebaseDocID = this.fireData.filter((fire) => {
            return fire.ID == updateNodeID;
          })[0].firebaseID;
          const updateRef = doc(db, "nodes", updateFirebaseDocID);
          if (updateNodeID > 0) {
            await updateDoc(updateRef, {
              PosX: Object.values(node)[0].x,
              PosY: Object.values(node)[0].y,
            });
          }
        },
      };
    }
  },
  destroyed() {
    this.fireDB();
  },
};
</script>

<style lang="postcss" scoped>
.formPanel {
  background-color: #fafafa;
  border: solid 1px;
  padding: 10px;
  width: 300px;
}
.mapContainer {
  display: flex;
  flex-direction: row;
  background-color: powderblue;
  height: 60vh;
}
</style>
