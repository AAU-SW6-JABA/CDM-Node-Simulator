# CDM node simulator

Generates real-time testing data for the CDM server.

To run this, you must have Node with Yarn installed.

Setup first:

```sh
yarn install
```

```sh
yarn setup
```

Run the simulator with:

```sh
yarn start
```

Or in dev mode with:

```sh
yarn dev
```

Change configuration in `config.ts`. Remember to have a `.env` file that specifies the host and port to connect to.
