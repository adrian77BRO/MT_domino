from flask import Flask, jsonify, request
from flask_cors import CORS
from load_xml import load_transitions

app = Flask(__name__)
CORS(app)

initial_state = 'q0'
accept_states = {'q47'}

def validate_domino_MT(domino):
    state = initial_state
    tape = list(domino) + [None]
    head = 0
    file_xml = 'domino.jff'
    transitions = load_transitions(file_xml)

    while state not in accept_states:
        symbol = tape[head] if head < len(tape) else ''
        key = (state, symbol)
        
        if key in transitions:
            write, move, new_state = transitions[key]
            if head < len(tape):
                tape[head] = write
            if move == 'R':
                head += 1
            elif move == 'L' and head > 0:
                head -= 1
            state = new_state
        else:
            return False
    
    return True

@app.route('/validate', methods=['POST'])
def validate_domino():
    data = request.get_json()
    domino = data.get('board')
    
    is_valid = validate_domino_MT(domino)
    
    if is_valid:
        return jsonify({"valid": True}), 200
    else:
        return jsonify({"valid": False}), 400
    
if __name__ == '__main__':
    app.run(debug=True)