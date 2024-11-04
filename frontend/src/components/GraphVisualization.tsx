//Using React ForceGraph Module

import React, { useState, useEffect } from "react";
import { ForceGraph3D, ForceGraph2D } from "react-force-graph";
import * as THREE from "three";


interface Resource {
  id: string;
  key: string;
  name: string;
  relations: {
    [key: string]: {
      resource: string;
      resource_id: string;
    };
  };
  roles: {
    [key: string]: {
      id: string;
      name: string;
      granted_to?: {
        users_with_role: Array<{
          linked_by_relation: string;
          on_resource: string;
          resource_id: string;
          role: string;
        }>;
      };
    };
  };
}

interface Node {
  id: string;
  label: string;
  group: string;
}

interface Link {
  source: string;
  target: string;
  label: string;
}

const GraphVisualization: React.FC = () => {
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({
    nodes: [],
    links: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api");
        const data: Resource[] = await response.json();

        const nodes: Node[] = [];
        const links: Link[] = [];

        // Create resource nodes
        data.forEach((resource) => {
          nodes.push({
            id: resource.id,
            label: `${resource.name} (${resource.key})`,
            group: resource.key,
          });

          // Create role nodes
          Object.entries(resource.roles).forEach(([roleName, roleDetails]) => {
            const roleNodeId = `${resource.id}-${roleName}`;
            nodes.push({
              id: roleNodeId,
              label: `${roleDetails.name} (${resource.key})`,
              group: "role",
            });

            // Link role to resource
            links.push({
              source: roleNodeId,
              target: resource.id,
              label: "has role on",
            });

            // Create permission links
            if (roleName === "org_admin") {
              data
                .filter((r) => r.key === "repo")
                .forEach((repo) => {
                  links.push({
                    source: roleNodeId,
                    target: repo.id,
                    label: "can manage",
                  });
                });
            } else if (roleName === "repo_admin") {
              data
                .filter((r) => r.key === "issue" || r.key === "pull_request")
                .forEach((item) => {
                  links.push({
                    source: roleNodeId,
                    target: item.id,
                    label: "can manage",
                  });
                });
            }
          });
        });

        // Create relation links
        data.forEach((resource) => {
          Object.entries(resource.relations).forEach(([err, relation]) => {
            links.push({
              source: resource.id,
              target: relation.resource_id,
              label: "belongs to",
            });
          });
        });

        setGraphData({ nodes, links });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <ForceGraph3D
      graphData={graphData}
      nodeLabel="label"
      nodeColor={(node: Node) => (node.group === "role" ? "red" : "blue")}
      linkLabel="label"
      onNodeClick={(node: Node) => alert(`Clicked on ${node.label}`)}
      nodeThreeObject={(node: Node) => {
        const group = new THREE.Group();

        // Create sphere
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(5),
          new THREE.MeshBasicMaterial({
            color: node.group === "role" ? "red" : "blue",
          })
        );
        group.add(sphere);

        // Create label
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(createLabelCanvas(node.label)),
          })
        );
        sprite.scale.set(20, 10, 0);
        sprite.position.set(7, 0, 0); 
        group.add(sprite);

        return group;
      }}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
    />
  );
};

// Helper function to create a canvas with the label text
function createLabelCanvas(text: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context) {
    context.font = "12px Arial";
    context.fillStyle = "white";
    context.fillText(text, 0, 12);
  }
  return canvas;
}

export default GraphVisualization;