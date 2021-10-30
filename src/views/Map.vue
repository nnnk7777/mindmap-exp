<template>
  <div class="map">
    <div v-if="this.isFilledState">
      <div v-if="this.loaded" class="mapContainer">
        <!-- マインドマップ -->
        <v-network-graph
          :nodes="nodes"
          :edges="edges"
          :layouts="layouts"
          :layers="layers"
          :configs="configs"
          :event-handlers="eventHandlers"
        >
          <!-- Replace the node component -->
          <template #override-node="{ nodeId, scale, config, ...slotProps }">
            <circle
              v-if="nodes[nodeId].type == 'circle'"
              :r="config.radius * scale"
              :fill="config.color"
              v-bind="slotProps"
            />
            <rect
              v-else-if="nodes[nodeId].type == 'rect'"
              :x="0 - config.radius"
              :y="0 - config.radius"
              rx="5"
              ry="5"
              :width="config.radius * 2"
              :height="config.radius * 2"
              :fill="config.color"
              v-bind="slotProps"
            />
            <!-- Use v-html to interpret escape sequences for icon characters. -->
            <text
              font-family="Material Icons"
              :font-size="22 * scale"
              fill="#ffffff"
              text-anchor="middle"
              dominant-baseline="central"
              style="pointer-events: none"
              v-html="nodes[nodeId].icon"
            />
          </template>
        </v-network-graph>
        <!-- 右のUIパネル -->
        <div class="formPanel">
          <p>マップ名: {{ this.mapName }}</p>
          <p>
            あなたは
            {{ this.userRole == "donor" ? "あげる人" : "もらう人" }}です
          </p>
          <p>
            今は，{{
              this.fireDataTurn[0].Turn == "donor" ? "あげる人" : "もらう人"
            }}のターンです
          </p>
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
          <input
            v-model="newNodeLabel"
            type="text"
            :disabled="this.fireDataTurn[0].Turn != this.userRole"
          />

          <!-- 形状の選択 -->
          <p style="font-weight: bold;">形状を選択してください</p>
          <div>
            <input
              v-model="newNodeShape"
              type="radio"
              name="shape"
              id="rect"
              value="rect"
              :disabled="this.fireDataTurn[0].Turn != this.userRole"
            />
            <label for="rect">四角</label>
            <input
              v-model="newNodeShape"
              type="radio"
              name="shape"
              id="circle"
              value="circle"
              :disabled="this.fireDataTurn[0].Turn != this.userRole"
            />
            <label for="circle">丸</label>
          </div>

          <!-- 追加ボタン -->
          <button
            @click="addNewNode()"
            :disabled="this.fireDataTurn[0].Turn != this.userRole"
          >
            Add
          </button>

          <!-- いいね機能 -->
          <div v-if="this.selectedNode">
            <p style="font-weight: bold;">
              いいねされてるかどうか
            </p>
            <p>
              {{
                this.selectedNode.Favorited
                  ? "いいねされてる"
                  : "いいねされてない"
              }}
            </p>

            <button
              v-if="this.selectedNode.Favorited == false"
              @click="handleFavorite()"
              :disabled="this.fireDataTurn[0].Turn != this.userRole"
            >
              いいね！
            </button>
            <button
              v-else
              @click="handleUnfavorite()"
              :disabled="this.fireDataTurn[0].Turn != this.userRole"
            >
              いいね取り消し
            </button>
          </div>

          <!-- ターン終了 -->
          <div>
            <button
              @click="toggleTurn()"
              :disabled="this.fireDataTurn[0].Turn != this.userRole"
            >
              操作を終了する
            </button>
          </div>
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
      fireDataTurn: null,
      fireDB: null,
      fireDBTurn: null,
      loaded: false,
      loadedTurn: false,
      selectedNodeID: null,
      newNodeLabel: null,
      newNodeShape: "circle",
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
          Favorited: false,
          Role: this.userRole,
          CreatedAt: new Date(),
        });

        addDoc(collection(db, "reactions"), {
          MapName: this.mapName,
          User: this.userName,
          NodeID: this.fireData.length,
          Reaction: "add_node",
          CreatedAt: new Date(),
        });
      } else {
        alert("未入力の項目があります");
      }
    },
    async handleFavorite() {
      const db = getFirestore();
      // 1. Reactionsにログを追加する
      await addDoc(collection(db, "reactions"), {
        MapName: this.mapName,
        User: this.userName,
        NodeID: this.selectedNodeID,
        Reaction: "favorite",
        CreatedAt: new Date(),
      });

      // 2. nodesの該当データを更新する
      let updateFirebaseDocID = this.fireData.filter((fire) => {
        return fire.ID == this.selectedNodeID;
      })[0].firebaseID;
      const updateRef = doc(db, "nodes", updateFirebaseDocID);

      await updateDoc(updateRef, {
        Favorited: true,
      });
    },
    async handleUnfavorite() {
      const db = getFirestore();
      // 1. Reactionsにログを追加する
      await addDoc(collection(db, "reactions"), {
        MapName: this.mapName,
        User: this.userName,
        NodeID: this.selectedNodeID,
        Reaction: "unfavorite",
        CreatedAt: new Date(),
      });

      // 2. nodesの該当データを更新する
      let updateFirebaseDocID = this.fireData.filter((fire) => {
        return fire.ID == this.selectedNodeID;
      })[0].firebaseID;
      const updateRef = doc(db, "nodes", updateFirebaseDocID);

      await updateDoc(updateRef, {
        Favorited: false,
      });
    },
    async toggleTurn() {
      const db = getFirestore();

      let updateFirebaseDocID = this.fireDataTurn.filter((turn) => {
        return turn.MapName == this.mapName;
      })[0].firebaseID;
      const updateRef = doc(db, "turns", updateFirebaseDocID);

      if (this.userRole == "donor") {
        await updateDoc(updateRef, {
          Turn: "donee",
        });
      } else if (this.userRole == "donee") {
        await updateDoc(updateRef, {
          Turn: "donor",
        });
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
          if (d.Favorited) tmp.icon = "&#xe87d";
          if (d.Shape) tmp.type = d.Shape;
          if (d.Color) tmp.color = d.Color;
          if (d.Label != "root")
            tmp.color = d.User === this.userName ? "#424dc7" : "#8fa4c7";
          // if (d.Role === 'donor') {
          //   tmp.color = "#f00"
          // } else if (d.Role === 'donee'){
          //   tmp.color = '#00f'
          // }
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
            radius: 18,
          },
          hover: {
            color: (node) => node.color || "#4466cc",
            radius: 20,
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
    async fireDataTurn() {
      let setLoaded = async (bool) => {
        this.loadedTurn = bool;
      };
      await setLoaded(false);
      await setLoaded(true);
    },
  },
  async created() {
    const db = getFirestore();

    if (this.isFilledState) {
      // nodesにこの名前のデータがすでにあるかどうか確認
      const queryForCheck = query(
        collection(db, "nodes"),
        where("MapName", "==", this.mapName)
      );
      const isEmptyDocument = await getDocs(queryForCheck);
      // もしまだ無かったら
      if (isEmptyDocument.empty) {
        // nodesにrootを追加
        addDoc(collection(db, "nodes"), {
          ID: 0,
          Color: "#282828",
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

      // turnsにこの名前のデータがすでにあるかどうか確認
      const queryForCheck2 = query(
        collection(db, "turns"),
        where("MapName", "==", this.mapName)
      );
      const isEmptyDocument2 = await getDocs(queryForCheck2);
      // もしまだ無かったら
      if (isEmptyDocument2.empty) {
        // データを追加
        // 最初はもらう側からスタート
        addDoc(collection(db, "turns"), {
          MapName: this.mapName,
          Turn: "donee",
          CreatedAt: new Date(),
        });
      }

      // 指定したマップ名のnodesデータを取得する準備
      const q = query(
        collection(db, "nodes"),
        where("MapName", "==", this.mapName)
      );
      // 指定したマップ名のnodesデータを取得！
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

      // 指定したマップ名のturnsデータを取得する準備
      const q2 = query(
        collection(db, "turns"),
        where("MapName", "==", this.mapName)
      );
      // 指定したマップ名のturnsデータを取得！
      this.fireDBTurn = onSnapshot(q2, (querySnapshot) => {
        this.loadedTurn = false;
        let tmp = [];
        querySnapshot.forEach((doc) => {
          let obj = doc.data();
          Object.assign(obj, { firebaseID: doc.id });
          tmp.push(obj);
        });
        this.fireDataTurn = tmp;
        this.loadedTurn = true;
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
    this.fireDBTurn();
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
  height: 95vh;
}
</style>
