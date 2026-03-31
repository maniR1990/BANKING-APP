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
*   **Source Code & Docker Containerisation:** Present. All microservices (Auth, Account, Customer) are containerised using Docker and orchestrated via `docker-compose.yml`.
*   **API Gateway:** Present. Implemented using Nginx (`nginx.conf`).
*   **Communication pattern - Synchronous:** Present. Communication between Nginx, downstream microservices, and databases is synchronous via HTTP/REST.

### Missing or Incomplete Deliverables:
*   **Writeup of identified microservices:** *Incomplete*. While brief descriptions of the Auth, Customer, and Account services exist in `README.md` and `ARCHITECTURE.md`, there is no detailed, dedicated writeup with explanations and justifications for the chosen microservices boundaries for the use case.
*   **Service Discovery:** *Missing*. Currently, NGINX hardcodes upstream hostnames (e.g., `http://banking_auth:3000`). While Docker DNS provides basic resolution, a dedicated Service Discovery tool (like Consul, Eureka, or Kubernetes CoreDNS) is not implemented.
*   **Communication pattern - Asynchronous:** *Missing*. There is no Message Broker (e.g., RabbitMQ, Kafka) or event bus implemented for asynchronous communication between the microservices.
*   **Screenshots of flow tested:** *Missing*. No screenshots or image files demonstrating the tested flows exist in the repository.