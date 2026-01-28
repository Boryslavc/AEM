# Content Service – Headless CMS Prototype

This project is a lightweight **headless content service** built with Node.js and Express.
It is designed to model the role of a **publish-tier CMS** (similar to Adobe Experience Manager Publish)
in a modern cloud-based content delivery architecture.

⚠️ **Work in progress:**  
This project is actively evolving. Additional functionality and improvements are planned.

---

## Purpose

The goal of this project is to gain hands-on understanding of:
- Content modeling
- Headless CMS principles
- Separation of content management from application logic
- HTTP-based content delivery in cloud environments

Rather than replicating a full CMS, the focus is on **core concepts** that apply to large-scale systems such as AEM Cloud Service.

---

## Key Features (Current)

- REST API for serving structured content
- Clear separation between content data and application code
- Stateless service design suitable for horizontal scaling
- Simple content store (in-memory / JSON-based)

---

## Architecture Overview

Client / Frontend -> Content Service (Node.js + Express) -> Content Store (in-memory / JSON)


The service:
- exposes content via HTTP endpoints
- does not perform caching itself
- assumes caching and acceleration are handled upstream

This mirrors how **AEM Publish instances** typically operate behind a CDN.

---

## Concepts Explored

- Content modeling and API design
- Decoupling content management from application logic
- Stateless service behavior and scalability
- The role of a publish tier in content-driven platforms

---

## Relevance to AEM Cloud

Adobe Experience Manager Cloud Service separates:
- content authoring
- content publishing
- content delivery

This project focuses specifically on understanding the **publish-side responsibilities** and how structured content is delivered to downstream systems.

---

## Planned Improvements

- Persistent storage layer
- Basic content versioning
- Validation of content models
- Integration with an edge cache / CDN simulation
- Improved API structure and error handling
