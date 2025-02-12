
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import math
import random
import sys


class LocalConsumer(AsyncWebsocketConsumer):
    def reset_states(self):
        initial_direction = {'x': 1, 'y': 0, 'z': 2}
        magnet = math.sqrt(sum(v*v for v in initial_direction.values()))
        self.initial_speed = 20
        self.speed = self.initial_speed
        self.ball = {
            'position' : {'x':0, 'y':0, 'z':0},
            'velocity' : {k: (v/magnet) * self.initial_speed for k,v in initial_direction.items()},
            'radius' : 0.5,
        }

        self.boundaries = {'x': 0, 'y': 0}
        self.win_score = 5
        self.game_started = False
        self.id = None
        self.players = {
	    	'paddle1': {
	    		'connected': None,
	    		'id': None,
	    		'channel_name': None,
                'dir': 0,
	    		'x': 0,
                'y': 0,
                'z': 19,
                'score': 0

	    	},
	    	'paddle2': {
	    		'connected': None,
	    		'id': None,
	    		'channel_name': None,
                'dir': 0,
	    		'x': 0,
                'y': 0,
                'z': -19,
                'score': 0
	    	},
        }
        self.paddle_positions = {'player1':0, 'player2':0}

    async def connect(self):
        self.reset_states()
        await self.accept()
        self.group_name = 'game'
        await self.channel_layer.group_add(self.group_name, self.channel_name)


    async def disconnect(self, error):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        # self.game_started = False

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        self.id = data.get('player')

        if message_type == 'update_player':
            if self.id == 'player1':
                self.players['paddle1']['dir'] = data.get('pad_direction')
            if self.id == 'player2':
                self.players['paddle2']['dir'] = data.get('pad_direction')

        if message_type == 'game_started':
            boundaries = data.get('boundaries', {})
            self.boundaries = {
                'x': boundaries.get('x'),
                'y': boundaries.get('y'),
            }
            await self.send(text_data=json.dumps({
                'type': 'game_started',
            }))
            self.game_started = True
            self.task = asyncio.create_task(self.game_loop())

    def paddle_limits(self, paddle):
        x = max(min(paddle, self.boundaries['x'] - 3), -self.boundaries['x'] + 3)
        if x > self.boundaries['x'] - 3:
            x = self.boundaries['x'] - 3
        elif x < -self.boundaries['x'] + 3:
            x = -self.boundaries['x'] + 3
        paddle = x
        return paddle

    def move_player(self):
        if self.id == 'player1':
            self.players['paddle1']['x'] += self.players['paddle1']['dir']
        if self.id == 'player2':
            self.players['paddle2']['x'] += self.players['paddle2']['dir']
        self.players['paddle1']['x'] = self.paddle_limits(self.players['paddle1']['x'])
        self.players['paddle2']['x'] = self.paddle_limits(self.players['paddle2']['x'])
        


    async def game_loop(self):
        while self.game_started:
            pl_one_score = self.players['paddle1']['score']
            pl_two_score = self.players['paddle2']['score']

            self.move_player()
            self.move_ball()

            await self.channel_layer.group_send(self.group_name, {
                'type': 'updates',
            })

            if (pl_one_score >= 3) or (pl_two_score >= 3):
                self.reset_states()
                self.task.cancel()
                await self.send(text_data=json.dumps({
                    'type': 'match_ended',
                }))
                break

            await asyncio.sleep(0.016)

    def sign(self, x):
        return (x > 0) - (x < 0)

    async def updates(self, event):
        await self.send(text_data=json.dumps({
            'type' : 'updates',
            'ball_position' : self.ball['position'],

            'player1_pos' : self.players['paddle1']['x'],
            'player2_pos' : self.players['paddle2']['x'],
            'player1_score' : self.players['paddle1']['score'],
            'player2_score' : self.players['paddle2']['score'],
        }))

    def move_ball(self):
        
        # tmp_pos = copy.deepcopy(self.ball['position'])
        self.ball['position']['x'] += self.ball['velocity']['x'] * 0.016
        self.ball['position']['y'] += self.ball['velocity']['y'] * 0.016
        self.ball['position']['z'] += self.ball['velocity']['z'] * 0.016

        #handle the BallxPaddle contact
        paddle_depth = 1
        paddle_width = 6
        target_paddle = self.players['paddle1'] if self.ball['velocity']['z'] > 0 else self.players['paddle2']

        if abs(abs(self.ball['position']['z']) - abs(target_paddle['z'])) < (self.ball['radius'] + paddle_depth/2):
            if abs(self.ball['position']['x'] - target_paddle['x']) < paddle_width/2:
                self.ball['velocity']['z'] *= -1

                hit_position = (self.ball['position']['x'] - target_paddle['x']) / (paddle_width/2)
                self.ball['velocity']['x'] = hit_position * 15

                #...normalize velocity and apply speed
                total_velocity = math.sqrt(self.ball['velocity']['x']**2 + self.ball['velocity']['z']**2)
                self.ball['velocity']['x'] = (self.ball['velocity']['x'] / total_velocity) * self.speed
                self.ball['velocity']['y'] = 0
                self.ball['velocity']['z'] = (self.ball['velocity']['z'] / total_velocity) * self.speed
                self.speed += 3
                return
        #handle BallxBounds contact and onGoal
        dx = self.boundaries['x'] - self.ball['radius'] - abs(self.ball['position']['x'])
        dz = self.boundaries['y'] - self.ball['radius'] - abs(self.ball['position']['z'])
        if dx <= 0:
            self.ball['position']['x'] = (self.boundaries['x'] - self.ball['radius'] + dx) * self.sign(self.ball['position']['x'])
            self.ball['velocity']['x'] *= -1
        if dz <= 0:
            self.speed = self.initial_speed
            if self.ball['velocity']['z'] < 0:
                self.players['paddle1']['score'] += 1
            else:
                self.players['paddle2']['score'] += 1
            self.ball['position'] = {'x': 0, 'y': 0, 'z': 0}
            total_velocity = math.sqrt(self.ball['velocity']['x']**2 + self.ball['velocity']['z']**2)
            self.ball['velocity']['x'] = random.uniform(-1, 1)
            self.ball['velocity']['y'] = 0
            self.ball['velocity']['z'] = (self.ball['velocity']['z'] / total_velocity)
            self.ball['velocity'] = {key: value * self.speed for key, value in self.ball['velocity'].items()}



class TournamentConsumer(AsyncWebsocketConsumer):
    tournament_players = {}
    current_match = {'player1': None, 'player2': None}
    matches = [
        # Semifinals
        {'player1': None, 'player2': None, 'completed': False, 'winner': None},
        {'player1': None, 'player2': None, 'completed': False, 'winner': None},
        # Final
        {'player1': None, 'player2': None, 'completed': False, 'winner': None}
    ]
    current_match_index = 0


    def reset_states(self):
        initial_direction = {'x': 1, 'y': 0, 'z': 2}
        magnet = math.sqrt(sum(v*v for v in initial_direction.values()))
        self.initial_speed = 20
        self.speed = self.initial_speed
        self.ball = {
            'position' : {'x':0, 'y':0, 'z':0},
            'velocity' : {k: (v/magnet) * self.initial_speed for k,v in initial_direction.items()},
            'radius' : 0.5,
        }
        #
        self.player_id = None
        self.player_name = None
        #
        self.boundaries = {'x': 0, 'y': 0}
        self.win_score = 5
        self.game_started = False
        self.id = None
        self.players = {
	    	'paddle1': {
	    		'connected': None,
	    		'id': None,
	    		'channel_name': None,
                'dir': 0,
	    		'x': 0,
                'y': 0,
                'z': 19,
                'score': 0

	    	},
	    	'paddle2': {
	    		'connected': None,
	    		'id': None,
	    		'channel_name': None,
                'dir': 0,
	    		'x': 0,
                'y': 0,
                'z': -19,
                'score': 0
	    	},
        }
        self.paddle_positions = {'player1':0, 'player2':0}

    async def connect(self):
        self.reset_states()
        await self.accept()
        self.group_name = 'tournament'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        # await self.send(json.dumps({
        #     'type': 'player_list',
        #     'players': self.tournament_players
        # }))


    async def disconnect(self, error):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'register_players':
            players_data = data.get('players')
            self.tournament_players = {
                'player1': {'name': players_data['player1'], 'connected': False, 'score': 0},
                'player2': {'name': players_data['player2'], 'connected': False, 'score': 0},
                'player3': {'name': players_data['player3'], 'connected': False, 'score': 0},
                'player4': {'name': players_data['player4'], 'connected': False, 'score': 0}
            }
            self.matches[0]['player1'] = players_data['player1']
            self.matches[0]['player2'] = players_data['player2']
            self.matches[1]['player1'] = players_data['player3']
            self.matches[1]['player2'] = players_data['player4']

            await self.channel_layer.group_send(self.group_name, {
                'type': 'tournament_update',
                'matches': self.matches,
                'currentMatch': self.current_match_index
            })

        elif message_type == 'select_player':
            player_id = data.get('player_id')
            if (player_id in self.tournament_players and not self.tournament_players[player_id]['connected']):
                self.player_id = player_id
                self.tournament_players[player_id]['connected'] = True

                await self.channel_layer.group_send(self.group_name, {
                    'type': 'player_update',
                    'players': self.tournament_players
                })

        elif message_type == 'update_player':
            self.player_id = data.get('player')
            if self.player_id == 'player1':
                self.players['paddle1']['dir'] = data.get('pad_direction')
            if self.player_id == 'player2':
                self.players['paddle2']['dir'] = data.get('pad_direction')

        elif message_type == 'game_started':
            self.reset_states()
            boundaries = data.get('boundaries', {})
            self.boundaries = {
                'x': boundaries.get('x'),
                'y': boundaries.get('y'),
            }
            self.game_started = True
            asyncio.create_task(self.game_loop())

    async def tournament_update(self, event):
        await self.send(json.dumps({
            'type': 'tournament_update',
            'matches': event['matches'],
            'currentMatch': event['currentMatch']
        }))
    async def player_update(self, event):
        await self.send(json.dumps({
            'type': 'player_update',
            'players': event['players']
        }))

    def all_players_connected(self):
        return all(player['connected'] for player in self.tournament_players.values())

    def start_next_match(self):
        if self.current_match_index < len(self.matches):
            if self.current_match_index == 2: #FINAAL GAME
                winner1 = self.get_match_winner(0)
                winner2 = self.get_match_winner(1)
                self.matches[2]['player1'] = winner1
                self.matches[2]['player2'] = winner2

    def get_match_winner(self, match_index):
        match = self.matches[match_index]
        player1_score = self.tournament_players[match['player1']]['score']
        player2_score = self.tournament_players[match['player2']]['score']
        return match['player1'] if player1_score > player2_score else match['player2']


    def paddle_limits(self, paddle):
        x = max(min(paddle, self.boundaries['x'] - 3), -self.boundaries['x'] + 3)
        if x > self.boundaries['x'] - 3:
            x = self.boundaries['x'] - 3
        elif x < -self.boundaries['x'] + 3:
            x = -self.boundaries['x'] + 3
        paddle = x
        return paddle

    def move_player(self):
        if self.player_id == 'player1':
            self.players['paddle1']['x'] += self.players['paddle1']['dir'] or 0
        if self.player_id == 'player2':
            self.players['paddle2']['x'] += self.players['paddle2']['dir'] or 0

        self.players['paddle1']['x'] = self.paddle_limits(self.players['paddle1']['x'])
        self.players['paddle2']['x'] = self.paddle_limits(self.players['paddle2']['x'])

    async def game_loop(self):
        while self.game_started:
            self.move_player()
            self.move_ball()
            await self.channel_layer.group_send(self.group_name, {
                'type': 'updates',
            })

            if self.players['paddle1']['score'] >= 3 or self.players['paddle2']['score'] >= 3:
                winner = 'player1' if self.players['paddle1']['score'] >= 3 else 'player2'
                await self.handle_match_competition(winner)
                break

            await asyncio.sleep(0.016)

    async def handle_match_competition(self, winner):
        self.matches[self.current_match_index]['completed'] = True
        self.matches[self.current_match_index]['winner'] = self.matches[self.current_match_index][winner]

        if self.current_match_index < 2:
            self.current_match_index += 1

            if self.current_match_index == 2:
                winner1 = self.matches[0]['winner']
                winner2 = self.matches[1]['winner']
                self.matches[2]['player1'] = winner1
                self.matches[2]['player2'] = winner2
                
                self.reset_match_state()
                
                await self.channel_layer.group_send(self.group_name, {
                    'type' : 'next_match',
                    'match_index' : self.current_match_index,
                    'player1' : winner1,
                    'player2' : winner2,
                })
        else:
            await self.channel_layer.group_send(self.group_name, {
                'type' : 'tournament_complete',
                'winner' : self.matches[2][winner]
            })

    def reset_match_state(self):
        self.players['paddle1']['score'] = 0
        self.players['paddle2']['score'] = 0
        self.game_started = False
        self.reset_states()

    async def next_match(self, event):
        await self.send(text_data=json.dumps({
            'type' : 'next_match',
            'match_index' : event['match_index'],
            'player1' : event['player1'],
            'player2' : event['player2'],
        }))

    async def tournament_complete(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tournament_complete',
            'winner': event['winner'],
        }))

    def sign(self, x):
        return (x > 0) - (x < 0)

    async def updates(self, event):
        await self.send(text_data=json.dumps({
            'type' : 'updates',
            'ball_position' : self.ball['position'],

            'player1_pos' : self.players['paddle1']['x'],
            'player2_pos' : self.players['paddle2']['x'],
            'player1_score' : self.players['paddle1']['score'],
            'player2_score' : self.players['paddle2']['score'],
        }))

    def move_ball(self):
        # tmp_pos = copy.deepcopy(self.ball['position'])
        self.ball['position']['x'] += self.ball['velocity']['x'] * 0.016
        self.ball['position']['y'] += self.ball['velocity']['y'] * 0.016
        self.ball['position']['z'] += self.ball['velocity']['z'] * 0.016


        #handle the BallxPaddle contact
        paddle_depth = 1
        paddle_width = 6
        target_paddle = self.players['paddle1'] if self.ball['velocity']['z'] > 0 else self.players['paddle2']

        if abs(abs(self.ball['position']['z']) - abs(target_paddle['z'])) < (self.ball['radius'] + paddle_depth/2):
            if abs(self.ball['position']['x'] - target_paddle['x']) < paddle_width/2:
                self.ball['velocity']['z'] *= -1

                hit_position = (self.ball['position']['x'] - target_paddle['x']) / (paddle_width/2)
                self.ball['velocity']['x'] = hit_position * 15

                #...normalize velocity and apply speed
                total_velocity = math.sqrt(self.ball['velocity']['x']**2 + self.ball['velocity']['z']**2)
                self.ball['velocity']['x'] = (self.ball['velocity']['x'] / total_velocity) * self.speed
                self.ball['velocity']['y'] = 0
                self.ball['velocity']['z'] = (self.ball['velocity']['z'] / total_velocity) * self.speed
                self.speed += 3
                return
        #handle BallxBounds contact and onGoal
        dx = self.boundaries['x'] - self.ball['radius'] - abs(self.ball['position']['x'])
        dz = self.boundaries['y'] - self.ball['radius'] - abs(self.ball['position']['z'])
        if dx <= 0:
            self.ball['position']['x'] = (self.boundaries['x'] - self.ball['radius'] + dx) * self.sign(self.ball['position']['x'])
            self.ball['velocity']['x'] *= -1
        if dz <= 0:
            self.speed = self.initial_speed
            if self.ball['velocity']['z'] < 0:
                self.players['paddle1']['score'] += 1
            else:
                self.players['paddle2']['score'] += 1
            self.ball['position'] = {'x': 0, 'y': 0, 'z': 0}
            total_velocity = math.sqrt(self.ball['velocity']['x']**2 + self.ball['velocity']['z']**2)
            self.ball['velocity']['x'] = random.uniform(-1, 1)
            self.ball['velocity']['y'] = 0
            self.ball['velocity']['z'] = (self.ball['velocity']['z'] / total_velocity)
            self.ball['velocity'] = {key: value * self.speed for key, value in self.ball['velocity'].items()}

