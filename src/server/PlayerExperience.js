import { Experience } from 'soundworks/server';

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor() {
    super('player');

    this.checkin = this.require('checkin');
    this.sharedConfig = this.require('shared-config');
    this.sharedParams = this.require('shared-params');
    this.osc = this.require('osc');

    this.onFingerDown = this.onFingerDown.bind(this);
    this.onFingerUp = this.onFingerUp.bind(this);
    this.onOscIntensity = this.onOscIntensity.bind(this);
  }

  start() {
    this.osc.receive('/intensity', this.onOscIntensity);
  }

  enter(client) {
    super.enter(client);

    this.sharedParams.update('numPlayers', this.clients.length);
    this.receive(client, 'finger-down', this.onFingerDown);
    this.receive(client, 'finger-up', this.onFingerUp);
  }

  exit(client) {
    super.exit(client);

    // make shure that finger leaves display when disconnecting
    this.broadcast('display', null, 'finger-up', client.index);

    this.sharedParams.update('numPlayers', this.clients.length);
  }

  onFingerDown(playerId, x, y, color) {
    this.broadcast('display', null, 'finger-down', playerId, x, y, color);
  }

  onFingerUp(playerId, x, y) {
    this.broadcast('display', null, 'finger-up', playerId);
  }

  onOscIntensity(intensity) {
    this.broadcast(['player', 'display'], null, 'intensity', intensity);    
  }
}
