# PM2

## Node.js 프로세스 매니저 PM2

Node.js는 싱글 스레드이기 때문에 CPU의 모든 코어를 사용할 수 없습니다. 예를 들어서 8코어 컴퓨터에서 Node.js를 사용한다면, 8개를 전부 사용할 수 있는 것이 아닌, 코어 1개만 사용할 수 있는 것입니다. Node.js에서는 모든 코어를 사용할 수 있게 Cluster 모듈을 제공합니다. 이 모듈을 통해 단일 프로세스를 멀티 프로세스로 늘릴 수 있습니다. 그렇게 된다면, Cluster 모듈을 통해서 마스터 프로세스에서 CPU 코어 수만큼 워커 프로세스를 생성해 모든 코어를 사용할 수 있게 개발하면 됩니다.

애플리케이션을 생성하면 마스터 프로세스가 생성됩니다. 이때 CPU 개수만큼 워커 프로세스를 생성하고 마스터 프로세스와 워커 프로세스가 할 일을 각각 정리해서 개발하면 됩니다. 하지만 이렇게 개발하는 것은 쉽지 않습니다. 이것을 쉽게 해주는 게 PM2 입니다.

## PM2 설치하기

```bash
$ npm i -g pm2@latest
```

## PM2 사용하기

먼저 저는 Next.js를 사용할 겁니다.

```bash
$ yarn create next-app frontend --ts
```

빌드 후에 실행해보겠습니다.

```bash
$ yarn build
$ pm2 start -n frontend -- start
```

이렇게 하면 Next.js를 데몬화하고 모니터링할 수 있습니다.

![Untitled](https://github.com/rldnrl-tutorial/pm2-playground/blob/main/imgs/fork-mode.png)

아무런 옵션 없이 실행을 하게 되면 기본 모드인 `fork` 모드로 작동하게 됩니다. 여러 코어를 사용하기 위해서는 `cluster` 모드를 사용해야합니다. 설정을 해봅시다.

```jsx
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'yarn start',
      instances: 0,
      exec_mode: 'cluster'
    }
  ]
}
```

`exce_node`에서 `cluster`로 작성하면 됩니다. 그리고 `instances: 0`으로 하게 되면 CPU의 모든 코어를 다 사용하겠다는 말이 됩니다.

```jsx
$ pm2 start ecosystem.config.js
```

![Untitled](https://github.com/rldnrl-tutorial/pm2-playground/blob/main/imgs/cluster-mode.png)

(현재 저는 10코어 M1 Pro 맥을 사용하고 있습니다.)

`cluster` 모드로 설정해서 Node.js가 싱글 스레드라서 CPU를 하나 밖에 이용하지 못하는 문제를 해결하였습니다.

### 프로세스 늘리고 줄이기

만약 프로세스의 개수를 늘려야하거나, 줄여야하는 상황이 온다면 어떻게 해야할까요? `pm2 scale` 명령어를 이용하면 됩니다. 예를 들어서 현재 8코어 사양의 서버를 가지고 있는데, 4코어만 사용하고 있는 상황입니다. 4코어를 늘리기 위해서 다음 명령어를 입력하면 됩니다.

```jsx
$ pm2 scale frontend +4
```

혹은 실행 중인 8개의 프로세스가 많다고 판단되면 다음 명령어를 입력해서 줄이면 됩니다.

```jsx
$ pm2 scale frontend 4
```

### 프로세스 재시작하기

수정 사항을 반영하고 싶다면 프로세스를 재시작하면 됩니다. `pm2 reload`로 실행 중인 프로세스를 재시작할 수 있습니다.

```jsx
$ pm2 reload frontend
```

### 프로세스 리스트 보기

프로세스의 리스트를 보려면 `pm2 list`를 입력하면 됩니다.

## 프로세스 재시작 과정

![Untitled](https://github.com/rldnrl-tutorial/pm2-playground/blob/main/imgs/reload-process.png)

프로세스가 10개가 있다고 가정해보겠습니다. 먼저 `pm2 reload` 명령어를 입력하게 되면,

(1)-(2). PM2는 기존의 0번 프로세스를 `_old_0` 프로세스로 옮기고, 새로운 0번 프로세스를 만듭니다.

(3). 새로운 0번 프로세스가 요청을 처리할 준비가 되면, 마스터 프로세스에게 `ready` 이벤트를 전달합니다.

(4). 마스터 프로세스는 더이상 필요 없어진 `_old_0` 프로세스에게 `SIGINT` 시그널을 보냅니다.

(5). `SIGINT` 시그널을 보낸 후 일정 시간(1600ms)가 지났음에도, 종료되지 않는다면, `SIGKILL` 시그널을 보내 강제로 종료시킵니다.

(6) 이 과정을 총 프로세스 개수만큼 반복하면 모든 프로세스의 재시작이 완료됩니다.