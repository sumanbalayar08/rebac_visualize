import React, { useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";

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
        users_with_role?: Array<{
          linked_by_relation: string;
          on_resource: string;
          role: string;
          role_id: string;
        }>;
      };
    };
  };
}

const GraphVisualisation: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api");
        const data: Resource[] = await response.json();

        const nodes: Node[] = [];
        const links: Edge[] = [];

        const roleNodeMap = new Map<string, string>();


        data.forEach((resource) => {
          // Create main resource nodes
          nodes.push({
            id: resource.id,
            data: { label: `${resource.name} (${resource.key})` },
            position: { x: Math.random() * 600, y: Math.random() * 400 },
            style: { background: "#bbdefb", padding: 8 },
          });

          // Create role nodes and links
          Object.entries(resource.roles).forEach(([roleName, roleDetails]) => {
            const roleNodeId = `${resource.id}-${roleName}`;
            roleNodeMap.set(`${resource.key}-${roleName}`, roleNodeId);
            nodes.push({
              id: roleNodeId,
              data: { label: `${roleDetails.name} (${resource.key})` },
              position: { x: Math.random() * 600, y: Math.random() * 400 },
              style: { background: "#ffcdd2", padding: 8 },
            });

            // Link role to resource
            links.push({
              id: `edge-${roleNodeId}-${resource.id}`,
              source: roleNodeId,
              target: resource.id,
              label: "has role on",
            });

            if (roleDetails.granted_to?.users_with_role) {
              roleDetails.granted_to.users_with_role.forEach((derivation) => {
                const sourceRoleNodeId = roleNodeMap.get(
                  `${derivation.on_resource}-${derivation.role}`
                );
                if (sourceRoleNodeId) {
                  links.push({
                    id: `derive-${sourceRoleNodeId}-${roleNodeId}`,
                    source: sourceRoleNodeId,
                    target: roleNodeId,
                    label: "derives",
                    animated:true
                  });
                }
              });
            }

            // Add permissions based on role
            if (roleName === "org_admin") {
              data
                .filter((r) => r.key === "repo")
                .forEach((repo) => {
                  links.push({
                    id: `edge-${roleNodeId}-${repo.id}`,
                    source: roleNodeId,
                    target: repo.id,
                    label: "can manage",
                  });
                });
            } else if (roleName === "repo_admin") {
              data
                .filter((r) => ["issue", "pull_request"].includes(r.key))
                .forEach((item) => {
                  links.push({
                    id: `edge-${roleNodeId}-${item.id}`,
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
          Object.entries(resource.relations).forEach(([_, relation]) => {
            links.push({
              id: `edge-${resource.id}-${relation.resource_id}`,
              source: resource.id,
              target: relation.resource_id,
              label: "belongs to",
            });
          });
        });

        setNodes(nodes);
        setEdges(links);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [setNodes, setEdges]);

  return (
    <div style={{ height: "90vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphVisualisation;
