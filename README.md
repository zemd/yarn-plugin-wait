# yarn-plugin-wait

> Plugin that can wait

## Usage

Install the plugin:
```sh
yarn plugin import https://raw.githubusercontent.com/zemd/yarn-plugin-wait/main/bundles/%40yarnpkg/plugin-wait.js
```

Waiting for specific amount of time:

```sh
yarn wait 2s
yarn wait 10m
yarn wait "15s 50ms"
```

Waiting for specific amount of time and running command at the end:

```sh
yarn wait 2m -c 'echo "Hello World!"'
```

Waiting for the command to return exit code `0` if it doesn't come try after the timeout:

```sh
yarn wait 10s -c 'docker exec -it postgres pg_isready' -w
```

## License

yarn-plugin-wait is released under the MIT license.

## Donate

[![](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/red_rabbit)
