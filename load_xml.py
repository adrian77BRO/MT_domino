import xml.etree.ElementTree as ET

def load_transitions(xml_file):
    transitions = {}
    
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    estados = {estado.attrib['id']: estado.attrib['name'] for estado in root.find('automaton').findall('state')}
    
    for transition in root.find('automaton').findall('transition'):
        since = estados[transition.find('from').text]
        until = estados[transition.find('to').text]
        read = transition.find('read').text if transition.find('read') is not None else ''
        write = transition.find('write').text if transition.find('write') is not None else ''
        move = transition.find('move').text if transition.find('move') is not None else ''
        
        key = (since, read)
        value = (write, move, until)
        
        transitions[key] = value
    
    return transitions