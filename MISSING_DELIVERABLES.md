# Missing Deliverables Report

Based on the required deliverables list:

*   A writeup of identified microservices for above use case along with reasonable explanation.
*   High level design document.
*   CI-CD Diagram.
*   Postman collection of APIs.
*   Source code of all microservices and demonstrate the following: -
    *   Containerisation with docker
    *   Service Discovery
    *   API Gateway
    *   Communication pattern
        *   Synchronous
        *   Asynchronous
*   Screenshots of flow tested.

Here is the current status of each item in the codebase:

### Present Deliverables:
*   **High Level Design Document:** Included in `ARCHITECTURE.md`.
*   **CI-CD Diagram:** Included in `ARCHITECTURE.md`.
*   **Postman Collection of APIs:** Provided in `Banking_App_API_Collection.postman_collection.json`.
*   **Source Code & Docker Containerisation:** Present. All microservices (Auth, Account, Customer) are containerised using Docker.
*   **Service Discovery:** Present. Natively implemented via Kubernetes Services (e.g., `ClusterIP` routing via internal DNS, where `http://banking-auth:3000` resolves to the `banking-auth` service pods).
*   **API Gateway:** Present. Implemented using Kubernetes Ingress Controller (`ingressClassName: nginx`), routing requests directly to the microservice cluster services.
*   **Communication pattern - Synchronous:** Present. Communication between the Ingress Gateway, downstream microservices, and databases is synchronous via HTTP/REST.

### Missing or Incomplete Deliverables:
*   **Writeup of identified microservices:** *Incomplete*. While brief descriptions of the Auth, Customer, and Account services exist in `README.md` and `ARCHITECTURE.md`, there is no detailed, dedicated writeup with explanations and justifications for the chosen microservices boundaries for the use case.
*   **Communication pattern - Asynchronous:** *Missing*. There is no Message Broker (e.g., RabbitMQ, Kafka) or event bus configured in the Kubernetes cluster manifests (`k8s/`) or microservice source code for asynchronous communication.
*   **Screenshots of flow tested:** *Missing*. No screenshots or image files demonstrating the tested flows exist in the repository.