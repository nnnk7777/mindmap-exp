<template>
  <div class="home">
    <div v-if="this.loaded" style="background-color: powderblue; height: 60vh">
      <v-network-graph
        :nodes="nodes"
        :edges="edges"
        :layouts="layouts"
        :configs="configs"
        :event-handlers="eventHandlers"
      />
    </div>
  </div>
</template>

<script>
import { GridLayout } from "v-network-graph";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

export default {
  name: "Home",
  data() {
    return {
      data: [
        {
          ID: 0,
          Label: "root",
          Parent: null,
          Shape: "rect",
          Color: "#cc4444",
          User: null,
        },
        {
          ID: 1,
          Label: "node1",
          Parent: 0,
          User: "nonaka",
        },
        {
          ID: 2,
          Label: "node2",
          Parent: 0,
          User: "inu",
        },
        {
          ID: 3,
          Label: "node3",
          Parent: 0,
          User: "nonaka",
        },
        {
          ID: 4,
          Label: "node4",
          Parent: 2,
          User: "inu",
        },
        {
          ID: 5,
          Label: "node5",
          Parent: 3,
          User: "nonaka",
        },
        {
          ID: 6,
          Label: "node6",
          Parent: 3,
          User: "nonaka",
        },
        {
          ID: 7,
          Label: "node7",
          Parent: 6,
          User: "nonaka",
        },
      ],
      eventHandlers: null,
      fireData: null,
      fireDB: null,
      mapName: "test1",
      loaded: false,
    };
  },
  methods: {
    clickedNode(e) {
      console.log(e);
    },
  },
  computed: {
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

    const queryForCheck = query(
      collection(db, "nodes"),
      where("MapName", "==", this.mapName)
    );
    const isEmptyDocument = await getDocs(queryForCheck);
    if (isEmptyDocument.empty) {
      addDoc(collection(db, "nodes"), {
        Color: "#cc4444",
        Label: "root",
        MapName: "test1",
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
        tmp.push(doc.data());
      });
      this.fireData = tmp;
      this.loaded = true;
    });

    this.eventHandlers = {
      "node:click": ({ node }) => {
        console.log(node);
      },
    };
  },
  destroyed() {
    this.fireDB();
  },
};
</script>
