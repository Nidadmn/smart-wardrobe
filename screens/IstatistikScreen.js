import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function IstatistikScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.glowOrb, { top: -100, right: -50, backgroundColor: '#D4C4FF', width: 400 }]} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Analizler</Text>
        <Text style={styles.subtitle}>Gardırop kullanım istatistiklerin</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Özet Kartları */}
        <View style={styles.glassCard}>
          <View style={styles.statRow}>
            <Feather name="pie-chart" size={24} color="#8A7BCA" />
            <Text style={styles.statTitle}>En Çok Giyilen Renk</Text>
            <Text style={styles.statValue}>Siyah (%42)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Feather name="trending-up" size={24} color="#FFAFAF" />
            <Text style={styles.statTitle}>Favori Parçan</Text>
            <Text style={styles.statValue}>Bej Trençkot</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Feather name="alert-circle" size={24} color="#A59B99" />
            <Text style={styles.statTitle}>Hiç Giyilmedi</Text>
            <Text style={styles.statValue}>12 Parça</Text>
          </View>
        </View>

        {/* Bilgilendirme Kutusu */}
        <View style={[styles.glassCard, { marginTop: 20, backgroundColor: 'rgba(138, 123, 202, 0.1)' }]}>
          <Text style={styles.infoText}>
            Yapay zekamızın analizine göre, gardırobundaki parçaların %30'u birbiriyle tam uyumlu. Daha fazla kombin önerisi için yeni parçalar ekle!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EFFF', paddingTop: 60 },
  glowOrb: { position: 'absolute', height: 400, borderRadius: 200, opacity: 0.5 },
  header: { paddingHorizontal: 25, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', color: '#2D2A26' },
  subtitle: { fontSize: 15, color: '#6B6280', marginTop: 5 },
  scrollContainer: { paddingHorizontal: 20 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 30, padding: 25, borderWidth: 1.5, borderColor: '#FFF' },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
  statTitle: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '600', color: '#2D2A26' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#8A7BCA' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.8)' },
  infoText: { fontSize: 14, color: '#6B6280', lineHeight: 22, textAlign: 'center', fontWeight: '500' }
});