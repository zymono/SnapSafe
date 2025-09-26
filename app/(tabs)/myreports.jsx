import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';

export default function Myreports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const myReports = data.myreports || [];

          // Process each report string
          const results = await Promise.all(
            myReports.map(async (item) => {
              const [orgId, reportId] = item.split('\\');
              try {
                const res = await axios.post('https://zymono-225ehrdsq-zymono.vercel.app/api/checkReport', {
                  org: orgId,
                  report: reportId,
                });
                return {
                  orgId,
                  reportId,
                  data: res.data.data,
                  status: res.data.status,
                };
              } catch (err) {
                return {
                  orgId,
                  reportId,
                  status: 'error',
                };
              }
            })
          );

          setReports(results);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading reports...</Text>
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No reports found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Reports</Text>

      {reports.map((r, index) => (
        <View
          key={`${r.orgId}-${r.reportId}-${index}`}
          style={[
            styles.card,
            r.status === 'Pending' ? styles.pendingCard : styles.reviewedCard,
          ]}
        >
          <Text style={styles.cardTitle}>Report ID: {r.reportId}</Text>
          <Text><b>Reason: {r.data?.reason || "Report data not available as this report has been completed"}</b></Text>
          <Text>Status: {r.status === 'Pending' ? 'Pending' : 'Reviewed'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    alignSelf: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  pendingCard: {
    backgroundColor: '#FFD580', // soft orange/yellow
  },
  reviewedCard: {
    backgroundColor: '#C8E6C9', // soft green
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
});
