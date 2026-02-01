# Mini AEM Cloud Delivery Pipeline

This repository combines two small projects to simulate a **simplified AEM Cloud content delivery pipeline**:

1. **Content Service** – a headless CMS prototype acting as the origin
2. **Edge Cache** – a lightweight CDN simulation handling caching and request routing

---

## Purpose

The goal of this combined project is to understand how **content is delivered at scale**
in modern cloud platforms like Adobe Experience Manager Cloud Service.

The focus is on:
- HTTP request flow
- Caching strategies
- Separation of responsibilities between origin and edge layers
- Performance and scalability trade-offs

---

## High-Level Architecture

Client -> Edge Cache (CDN Simulation) -> Content Service (Origin / Publish)


---

## Content Service (Origin)

The content service:
- exposes structured content via REST APIs
- remains stateless
- focuses solely on content delivery

This models the behavior of **AEM Publish instances**.

---

## Edge Cache (CDN Simulation)

The edge cache:
- intercepts incoming requests
- caches responses based on URL and headers
- reduces load on the origin service
- simulates cache hits, misses, and TTL expiration

This models the behavior of a **CDN layer in front of AEM Cloud**.

---

## Concepts Demonstrated

- HTTP caching semantics (cache hits, misses, TTL)
- Request routing between edge and origin
- Benefits of caching for performance and scalability
- How content structure and URLs affect cache efficiency
- Clear separation between delivery and content responsibilities

---

## Relevance to AEM Cloud

In AEM Cloud Service:
- clients interact primarily with the CDN
- publish instances act as origins
- caching is critical for performance and reliability

This project models those responsibilities in a simplified, educational way.

---

## Planned Improvements

- Cache invalidation strategies
- Simulated traffic and load testing
- Deployment using containers
