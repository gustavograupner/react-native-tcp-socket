/**
 * Sample React Native TCP/Socket App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Button,
  TextInput,
  Alert,
} from 'react-native';

import TcpSocket from 'react-native-tcp-socket';
import {NetworkInfo} from 'react-native-network-info';

const App: () => React$Node = () => {
  const [log, setLog] = useState([]);
  const [server, setServer] = useState(null);
  const [serverPort, setServerPort] = useState(null);
  const [serverTitle, setServerTitle] = useState('Run Server');
  const [clientTitle, setClientTitle] = useState('Connect Client');
  const [client, setClient] = useState(null);
  const [serverHost, setServerHost] = useState('');
  const [clientServerHost, setClientServerHost] = useState('');

  useEffect(() => { 
    NetworkInfo.getIPV4Address().then(ipv4Address => {
      setServerHost(ipv4Address);
    });
  });

  const handleOnServerPressed = () => {
    setServerPort(Number(9 + (Math.random() * 999).toFixed(0)));
    NetworkInfo.getIPV4Address().then(ipv4Address => {
      setServerHost(ipv4Address);
      if (!server) {
        const server = TcpSocket.createServer(socket => {
          console.log(
            `Server connected on + ${JSON.stringify(socket.address())}`,
          );
          socket.on('data', data => {
            console.log(`Server Received: ${data}`);
            setLog(oldLogs => [...oldLogs, `Server Received: ${data}`]);
            socket.write('Hi Client!');
          });

          socket.on('error', error => {
            console.log(`server client error ${error}`);
          });

          socket.on('close', error => {
            console.log(`Erro to close server: ${error}`);
          });
        }).listen(
          {port: serverPort, host: ipv4Address, reuseAddress: true},
          address => {
            console.log(`Opened server on ${JSON.stringify(address)}`);
          },
        );

        server.on('error', error => {
          console.log(`Server error  ${error}`);
        });

        server.on('close', () => {
          console.log('Server closed');
        });

        setServer(server);
        setServerTitle('Stop Server');
        return;
      }
      if (client) client.destroy();
      server.close();
      setServer(null);
      setClient(null);
      setServerTitle('Run Server');
      setClientTitle('Connect Client');
    });
  };

  const handleOnClientPressed = () => {
    if (clientServerHost) {
      if (!client) {
        const client = TcpSocket.createConnection(
          {
            port: serverPort,
            host: clientServerHost,
            reuseAddress: true,
          },
          address => {
            setClientTitle('Disconnect Client ', address);
          },
        );

        client.on('data', data => {
          console.log(`Client Received: ${data}`);
          setLog(oldLogs => [...oldLogs, `Client Received: ${data}`]);
        });

        client.on('error', error => {
          console.log(`client error ${error}`);
        });

        client.on('close', () => {
          console.log('client close');
        });

        setClient(client);
        return;
      }
      client.destroy();
      setClient(null);
      setClientTitle('Connect Client');
      return;
    }
    Alert.alert('Server address must be informed.');
  };

  const handleOnSendMessagePressed = () => {
    client.write('Hi Server!');
  };

  const renderServerInfo = () => {
    if (serverHost && serverPort) {
      return (
        <View>
          <Text>Ip: {serverHost}</Text>
          <Text>Port: {serverPort}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <Button title={serverTitle} onPress={handleOnServerPressed} />
          {renderServerInfo()}
        </View>
        <View style={{flex: 1}}>
          <TextInput
            style={{borderWidth: 1, padding: 10}}
            placeholder="0.0.0.0"
            keyboardType="numbers-and-punctuation"
            value={clientServerHost}
            onChangeText={text => setClientServerHost(text)}
          />
          <Button title={clientTitle} onPress={handleOnClientPressed} />
          <Button
            title="Send message to Server"
            onPress={handleOnSendMessagePressed}
          />
        </View>
        <View style={{flex: 1}}>
          {log.map((l, index) => (
            <Text key={index}>{l}</Text>
          ))}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
