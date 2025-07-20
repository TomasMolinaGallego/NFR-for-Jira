# NFR for Jira

## Para el tribunal del TFM

El funcionamiento de este plugin se puede encontrar en mi página personal de Atlassian Jira: https://tomasmolinaumu.atlassian.net/jira/apps/21a61f7f-9789-40f6-a579-99e1d4e0c1a4/73f6f55e-6f65-409a-89f7-fe0ab436aeec/create-catalogues

Los catálogos de prueba están incluidos en la carpeta catalogs, son csv donde solo se necesita copiar y pegar.

## Description

This project features a straightforward Forge app built with JavaScript, designed to create and manage non-functionnal requirements catalogs, link those requirements to Jira Issues and see differents statistiques. The application is accessible from a dedicated Jira global page. Some of the key modules utilized in the app include [UI kit](https://developer.atlassian.com/platform/forge/ui-kit/components/) for frontend.

See [developer.atlassian.com/platform/forge/](https://developer.atlassian.com/platform/forge) for documentation and tutorials explaining Forge.

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Quick start

- Register your app by running:

```
forge register
```

- Install npm dependencies for your app by running:

```
npm install
```

- Build and deploy your app by running:

```
forge deploy
```

- Install your app in an Atlassian site by running:

```
forge install
```

- Develop your app by running `forge tunnel` to proxy invocations locally:

```
forge tunnel
```

### Notes

- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

### Usage

- Navigate to `Apps` -> `Your apps` -> `NFR Tracer` from the top navigation bar in Jira
- Select one of the three pages available: **View catalogues**, **View requirements**, **Create catalogues**
- If first usage -> Create your own catalog with a title, description and a prefix which will be used to name the requirements
- You can create the requirements by hand, writing all the fields or by CSV, you have to use this template:
  - ID,Title,Description,Type,Category,Important,Validation,CorrelationRules,Dependencies
- And as example of CSV:
  - ID,Title,Description,Type,Category,Important,Validation,CorrelationRules,Dependencies
    1,Fast Page Load,Ensure that webpages load within 2 seconds under normal load,Non-Functional,Performance,90,Load tests measuring page response times,2;3,4;5
    2,High Throughput,System should handle 5000 transactions per minute without degradation,Non-Functional,Performance,85,Stress testing under peak load conditions,1;6,7
- From **View requirements** you can see a detailed page with all the information about the catalog, the requirements and the Jira issues linked to that catalog
- To link a requirement to a catalog:
  - First, search the desired issue
  - In the button `Applications` -> `NFR Requirements`
  - And 2 panel will be displayed below the description
    - A searcher with all the requirements, where pressing the button `Seleccionar` will link that requirement to that Jira issue
    - A display for all the requirements linked to that Jira issue
      - Here you can read all the information about the requirement and in the column `Actions` there are 3 buttons
        - `Validate` to mark as validated the requirement in that Jira Issue
        - `Invalidate` to as invalidated the requiement in that Jira Issue
        - `Desvincular` to delete the link with that requirement