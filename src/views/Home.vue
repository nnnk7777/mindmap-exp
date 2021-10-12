<template>
  <div class="home">
    <v-network-graph
      :nodes="nodes"
      :edges="edges"
      :layouts="layouts"
      :configs="configs"
      @click="clickedView"
    />
  </div>
</template>

<script>
import { GridLayout } from "v-network-graph";

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
          Draggable: false,
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
      ],
    };
  },
  computed: {
    nodes() {
      let _nodes = {};
      this.data.forEach((d) => {
        let tmp = {};
        tmp.name = d.Label;
        if (d.Shape) tmp.type = d.Shape;
        if (d.Color) tmp.color = d.Color;
        if (d.Draggable != null) tmp.draggable = d.Draggable;
        _nodes[`node${d.ID}`] = tmp;
      });
      return _nodes;
    },
    edges() {
      let _edges = {};
      this.data.forEach((d) => {
        if (d.Parent != null) {
          let tmp = {};
          tmp.source = `node${d.Parent}`;
          tmp.target = `node${d.ID}`;
          _edges[`edge${d.ID}`] = tmp;
        }
      });
      return _edges;
    },
    layouts() {
      // let _layouts = {};
      // 下のようなレイアウトをthis.dataから生成する
      return {
        nodes: {
          node0: { x: 0, y: 0 },
          node1: { x: 100, y: 50 },
          node2: { x: -50, y: 50 },
          node3: { x: 100, y: -50 },
          node4: { x: -100, y: 50 },
          node5: { x: 180, y: -100 },
          node6: { x: 180, y: 0 },
        },
      };
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
          layoutHandler: new GridLayout({ grid: 20 }),
        },
      };
    },
  },
};
</script>
